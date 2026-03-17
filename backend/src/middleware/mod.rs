use axum::{
  extract::Request,
  middleware::Next,
  response::{IntoResponse, Response},
  Json,
};
use serde::Serialize;
use tower_http::cors::{AllowOrigin, Any, CorsLayer};

#[derive(Serialize)]
struct ErrorResponse {
  error: &'static str,
}

pub async fn require_internal_auth(request: Request, next: Next) -> Response {
  let has_user = request
    .headers()
    .get("X-Internal-User-Id")
    .and_then(|v| v.to_str().ok())
    .is_some();

  if !has_user {
    return (
      axum::http::StatusCode::UNAUTHORIZED,
      Json(ErrorResponse {
        error: "Missing internal auth header",
      }),
    )
      .into_response();
  }

  next.run(request).await
}

pub fn cors_layer() -> CorsLayer {
  use axum::http::HeaderValue;

  let allowed = std::env::var("CORS_ALLOWED_ORIGINS")
    .unwrap_or_else(|_| "http://localhost:3001,http://127.0.0.1:3001".to_string());

  let origins: Vec<HeaderValue> = allowed
    .split(',')
    .map(|s| s.trim())
    .filter(|s| !s.is_empty())
    .filter_map(|s| HeaderValue::from_str(s).ok())
    .collect();

  let origins = if origins.is_empty() {
    vec![
      HeaderValue::from_static("http://localhost:3001"),
      HeaderValue::from_static("http://127.0.0.1:3001"),
    ]
  } else {
    origins
  };

  CorsLayer::new()
    .allow_origin(AllowOrigin::list(origins))
    .allow_methods(Any)
    .allow_headers(Any)
}
