use axum::{http::StatusCode, Json};
use serde_json::Value;

pub type ApiError = (StatusCode, Json<Value>);

pub fn bad_request(msg: &str) -> ApiError {
  (
    StatusCode::BAD_REQUEST,
    Json(serde_json::json!({ "error": msg })),
  )
}

pub fn not_found(msg: &str) -> ApiError {
  (
    StatusCode::NOT_FOUND,
    Json(serde_json::json!({ "error": msg })),
  )
}

pub fn internal(e: impl std::fmt::Display) -> ApiError {
  (
    StatusCode::INTERNAL_SERVER_ERROR,
    Json(serde_json::json!({ "error": e.to_string() })),
  )
}

pub fn bad_gateway(msg: impl std::fmt::Display) -> ApiError {
  (
    StatusCode::BAD_GATEWAY,
    Json(serde_json::json!({ "error": msg.to_string() })),
  )
}

pub fn service_unavailable(msg: &str) -> ApiError {
  (
    StatusCode::SERVICE_UNAVAILABLE,
    Json(serde_json::json!({ "error": msg })),
  )
}

pub fn db_error(e: sqlx::Error) -> ApiError {
  internal(e)
}

pub fn conflict(msg: &str) -> ApiError {
  (
    StatusCode::CONFLICT,
    Json(serde_json::json!({ "error": msg })),
  )
}
