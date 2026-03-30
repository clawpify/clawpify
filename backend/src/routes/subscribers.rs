use std::net::{IpAddr, Ipv4Addr};
use std::sync::Arc;

use axum::{extract::State, routing::post, Json, Router};
use axum::http::Request;
use tower_governor::{
  governor::GovernorConfigBuilder,
  key_extractor::{KeyExtractor, SmartIpKeyExtractor},
  GovernorError, GovernorLayer,
};

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

async fn subscribe(
  State(state): State<AppState>,
  Json(body): Json<SubscriberRequest>,
) -> Result<Json<SubscriberResponse>, ApiError> {
  let email = body.email.trim().to_lowercase();

  if email.is_empty() {
    return Err(error::bad_request("Email is required"));
  }
  if !email.contains('@') {
    return Err(error::bad_request("Invalid email"));
  }

  let result = sqlx::query(
    r#"INSERT INTO subscribers (email) VALUES ($1)
       ON CONFLICT (email) DO NOTHING
       RETURNING id"#,
  )
  .bind(&email)
  .fetch_optional(&state.pool)
  .await
  .map_err(error::db_error)?;

  Ok(Json(SubscriberResponse {
    ok: true,
    already_subscribed: if result.is_none() { Some(true) } else { None },
  }))
}
