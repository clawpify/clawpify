use axum::{
  extract::Request,
  http::{HeaderName, HeaderValue},
  middleware::Next,
  response::{IntoResponse, Response},
};
use tower_http::cors::{AllowOrigin, Any, CorsLayer};

static X_REQUEST_ID: HeaderName = HeaderName::from_static("x-request-id");

pub async fn require_internal_auth(request: Request, next: Next) -> Response {
  let has_user = request
    .headers()
    .get("X-Internal-User-Id")
    .and_then(|v| v.to_str().ok())
    .is_some();

  if !has_user {
    return crate::error::ApiError::unauthorized("Missing internal auth header").into_response();
  }

  next.run(request).await
}

pub async fn request_id(mut request: Request, next: Next) -> Response {
  let id = request
    .headers()
    .get(&X_REQUEST_ID)
    .and_then(|v| v.to_str().ok())
    .filter(|s| !s.is_empty())
    .map(String::from)
    .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

  let hv = HeaderValue::from_str(&id).unwrap_or_else(|_| HeaderValue::from_static("invalid-id"));
  request.headers_mut().insert(&X_REQUEST_ID, hv.clone());

  let mut response = next.run(request).await;
  response.headers_mut().insert(&X_REQUEST_ID, hv);
  response
}

pub async fn log_requests(request: Request, next: Next) -> Response {
  let method = request.method().clone();
  let path = request.uri().path().to_owned();
  let rid = request
    .headers()
    .get(&X_REQUEST_ID)
    .and_then(|v| v.to_str().ok())
    .unwrap_or("-")
    .to_owned();
  let response = next.run(request).await;
  let status = response.status();
  println!("[{}] {} {} -> {}", rid, method, path, status);
  response
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
