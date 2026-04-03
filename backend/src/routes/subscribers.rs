use std::net::{IpAddr, Ipv4Addr};
use std::sync::Arc;

use axum::{extract::State, routing::post, Json, Router};
use axum::http::Request;
use tower_governor::{
  governor::GovernorConfigBuilder,
  key_extractor::{KeyExtractor, SmartIpKeyExtractor},
  GovernorError, GovernorLayer,
};

use super::extractors::ClientIpAddress;

/// Rate-limit by client IP when available (`SmartIpKeyExtractor`); fall back to loopback for tests
/// and clients without `ConnectInfo` or proxy headers.
#[derive(Clone, Copy, Debug)]
struct SubscribersKeyExtractor;

impl KeyExtractor for SubscribersKeyExtractor {
  type Key = IpAddr;

  fn extract<T>(&self, req: &Request<T>) -> Result<Self::Key, GovernorError> {
    Ok(
      SmartIpKeyExtractor
        .extract(req)
        .unwrap_or(IpAddr::V4(Ipv4Addr::LOCALHOST)),
    )
  }
}

use super::state::AppState;
use crate::dto::subscribers::{SubscriberRequest, SubscriberResponse};
use crate::error::{self, ApiError};
use crate::util::client_ip;

pub fn routes() -> Router<AppState> {
  let governor_conf = Arc::new(
    GovernorConfigBuilder::default()
      .per_second(25)
      .burst_size(50)
      .key_extractor(SubscribersKeyExtractor)
      .finish()
      .expect("governor config"),
  );

  Router::new()
    .route("/subscribers", post(subscribe))
    .layer(GovernorLayer {
      config: governor_conf,
    })
}

fn waitlist_ip_pepper() -> Result<String, ApiError> {
  match std::env::var("WAITLIST_IP_PEPPER") {
    Ok(s) if !s.is_empty() => Ok(s),
    Ok(_) | Err(_) => {
      if cfg!(debug_assertions) {
        Ok("dev-waitlist-pepper-change-me".to_string())
      } else {
        Err(error::service_unavailable(
          "Waitlist signing is not configured",
        ))
      }
    }
  }
}

fn waitlist_max_signups_per_ip_per_day() -> i64 {
  std::env::var("WAITLIST_MAX_SIGNUPS_PER_IP_PER_DAY")
    .ok()
    .and_then(|s| s.parse().ok())
    .filter(|&n: &i64| n > 0)
    .unwrap_or(5)
}

async fn subscribe(
  State(state): State<AppState>,
  ClientIpAddress(ip): ClientIpAddress,
  Json(body): Json<SubscriberRequest>,
) -> Result<Json<SubscriberResponse>, ApiError> {
  let email = body.email.trim().to_lowercase();

  if email.is_empty() {
    return Err(error::bad_request("Email is required"));
  }
  if !email.contains('@') {
    return Err(error::bad_request("Invalid email"));
  }

  let exists: bool = sqlx::query_scalar(
    r#"SELECT EXISTS(SELECT 1 FROM waitlist WHERE email = $1)"#,
  )
  .bind(&email)
  .fetch_one(&state.pool)
  .await
  .map_err(error::db_error)?;

  if exists {
    return Ok(Json(SubscriberResponse {
      ok: true,
      already_subscribed: Some(true),
    }));
  }

  let pepper = waitlist_ip_pepper()?;
  let ip_hash = client_ip::hash_client_ip(&pepper, ip);
  let max = waitlist_max_signups_per_ip_per_day();

  let count: i64 = sqlx::query_scalar(
    r#"SELECT COUNT(*)::bigint FROM waitlist
       WHERE ip_hash = $1 AND created_at > NOW() - INTERVAL '1 day'"#,
  )
  .bind(&ip_hash)
  .fetch_one(&state.pool)
  .await
  .map_err(error::db_error)?;

  if count >= max {
    tracing::warn!("waitlist per-IP cap reached");
    return Err(error::too_many_requests(
      "Too many signups from this network. Try again later.",
    ));
  }

  let result = sqlx::query(
    r#"INSERT INTO waitlist (email, ip_hash) VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING
       RETURNING id"#,
  )
  .bind(&email)
  .bind(&ip_hash)
  .fetch_optional(&state.pool)
  .await
  .map_err(error::db_error)?;

  Ok(Json(SubscriberResponse {
    ok: true,
    already_subscribed: if result.is_none() { Some(true) } else { None },
  }))
}
