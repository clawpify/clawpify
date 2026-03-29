use axum::{extract::State, routing::post, Json, Router};

use super::state::AppState;
use crate::dto::subscribers::{SubscriberRequest, SubscriberResponse};
use crate::error::{self, ApiError};

pub fn routes() -> Router<AppState> {
  Router::new().route("/subscribers", post(subscribe))
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
