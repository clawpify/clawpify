use axum::{Extension, Json};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::error::{self, ApiError};

#[derive(Deserialize)]
pub struct SubscriberRequest {
  pub email: String,
}

#[derive(Serialize)]
pub struct SubscriberResponse {
  pub ok: bool,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub already_subscribed: Option<bool>,
}

pub async fn subscribe(
  Extension(pool): Extension<PgPool>,
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
  .fetch_optional(&pool)
  .await
  .map_err(error::db_error)?;

  Ok(Json(SubscriberResponse {
    ok: true,
    already_subscribed: if result.is_none() { Some(true) } else { None },
  }))
}