use axum::{http::HeaderMap, Extension, Json};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::{self, ApiError};
use crate::rate_limit;

const RATE_LIMIT_MESSAGE: &str =
  "Rate limit exceeded. You can join the waitlist up to 5 times per 2 days.";

/// Enforces waitlist rate limit. Logged-in users (X-Internal-User-Id) bypass.
async fn enforce_waitlist_rate_limit(
  headers: &HeaderMap,
  pool: &PgPool,
) -> Result<(), ApiError> {
  if headers.get("X-Internal-User-Id").is_some() {
    return Ok(());
  }
  let ip = headers
    .get("X-Client-IP")
    .and_then(|v| v.to_str().ok())
    .unwrap_or("unknown");
  let allowed = rate_limit::check_and_record_waitlist(pool, ip)
    .await
    .map_err(error::db_error)?;
  if allowed {
    Ok(())
  } else {
    Err(error::rate_limit_exceeded(RATE_LIMIT_MESSAGE))
  }
}

#[derive(Deserialize)]
pub struct JoinRequest {
  pub email: String,
  #[serde(default)]
  pub interests: JoinInterests,
}

#[derive(Deserialize, Default)]
pub struct JoinInterests {
  #[serde(default)]
  pub wait_till_launch: bool,
  #[serde(default)]
  pub observability_to_multiple_models: bool,
}

#[derive(Serialize)]
pub struct JoinResponse {
  pub id: Uuid,
  pub already_on_list: bool,
}

pub async fn join(
  Extension(pool): Extension<PgPool>,
  headers: HeaderMap,
  Json(body): Json<JoinRequest>,
) -> Result<Json<JoinResponse>, ApiError> {
  enforce_waitlist_rate_limit(&headers, &pool).await?;

  let email = body.email.trim().to_lowercase();
  if email.is_empty() {
    return Err(error::bad_request("Email is required"));
  }
  if !email.contains('@') {
    return Err(error::bad_request("Invalid email"));
  }

  let interests = serde_json::json!({
    "wait_till_launch": body.interests.wait_till_launch,
    "observability_to_multiple_models": body.interests.observability_to_multiple_models,
  });

  // Check if email already exists
  let existing: Option<(Uuid,)> =
    sqlx::query_as(r#"SELECT id FROM waitlist WHERE email = $1"#)
      .bind(&email)
      .fetch_optional(&pool)
      .await
      .map_err(error::db_error)?;

  if let Some((id,)) = existing {
    return Ok(Json(JoinResponse {
      id,
      already_on_list: true,
    }));
  }

  let row: (Uuid,) = sqlx::query_as(
    r#"INSERT INTO waitlist (email, interests)
       VALUES ($1, $2)
       RETURNING id"#,
  )
  .bind(&email)
  .bind(&interests)
  .fetch_one(&pool)
  .await
  .map_err(error::db_error)?;

  Ok(Json(JoinResponse {
    id: row.0,
    already_on_list: false,
  }))
}
