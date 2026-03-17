use axum::{
  extract::Request,
  http::HeaderValue,
  middleware::{self, Next},
  response::{IntoResponse, Response},
  routing::{get, post, put},
  Extension, Json, Router,
};
use serde::Serialize;
use std::net::SocketAddr;
use tower_http::cors::{AllowOrigin, Any, CorsLayer};

use backend::{agent_activity, ai_visibility, audit, db, stores, subscribers};

#[derive(Serialize)]
struct ApiResponse {
  ok: bool,
  message: &'static str,
}

#[derive(Serialize)]
struct ErrorResponse {
  error: &'static str,
}

async fn require_internal_auth(request: Request, next: Next) -> Response {
  let user_id = request
    .headers()
    .get("X-Internal-User-Id")
    .and_then(|v| v.to_str().ok());

  if user_id.is_none() {
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

#[tokio::main]
async fn main() {
  dotenvy::dotenv().ok();
  let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
  let pool = db::create_pool(&database_url)
    .await
    .expect("Failed to create DB pool");

  let rate_limit_pool = if let Ok(url) = std::env::var("RATE_LIMIT_DATABASE_URL") {
    Some(
      db::create_rate_limit_pool(&url)
        .await
        .expect("Failed to create rate limit DB pool"),
    )
  } else {
    None
  };

  let allowed = std::env::var("CORS_ALLOWED_ORIGINS")
    .unwrap_or_else(|_| "http://localhost:3001,http://127.0.0.1:3001".to_string());
  let origins: Vec<HeaderValue> = allowed
    .split(',')
    .map(|s| s.trim())
    .filter(|s| !s.is_empty())
    .map(|s| HeaderValue::from_str(s).expect("Invalid CORS_ALLOWED_ORIGINS"))
    .collect();
  let origins = if origins.is_empty() {
    vec![
      HeaderValue::from_static("http://localhost:3001"),
      HeaderValue::from_static("http://127.0.0.1:3001"),
    ]
  } else {
    origins
  };

  let cors = CorsLayer::new()
    .allow_origin(AllowOrigin::list(origins))
    .allow_methods(Any)
    .allow_headers(Any);

  let protected = Router::new()
    .route(
      "/api/radar",
      get(|| async {
        Json(ApiResponse {
          ok: true,
          message: "radar",
        })
      }),
    )
    .route(
      "/api/shield",
      put(|| async {
        Json(ApiResponse {
          ok: true,
          message: "shield",
        })
      }),
    )
    .route(
      "/api/stores",
      get(stores::list_stores).post(stores::create_store),
    )
    .route(
      "/api/ai-visibility/products",
      get(ai_visibility::get_products),
    )
    .route(
      "/api/agent-activity",
      get(agent_activity::list_activity).post(agent_activity::log_activity),
    )
    .route_layer(middleware::from_fn(require_internal_auth))
    .layer(Extension(pool.clone()));

  let public = Router::new()
    .route(
      "/api/health",
      get(|| async { Json(serde_json::json!({ "ok": true, "service": "clawpify-backend" })) }),
    )
    .route(
      "/api/chatgpt-citation/generate",
      post(audit::citation::generate_prompts_and_competitors),
    )
    .route(
      "/api/chatgpt-citation",
      post(audit::citation::create_citation),
    )
    .route(
      "/api/chatgpt-citation/:id",
      get(audit::citation::get_citation),
    )
    .route("/api/subscribers", post(subscribers::subscribe))
    .layer(Extension(pool))
    .layer(Extension(rate_limit_pool));

  let app = Router::new().merge(protected).merge(public).layer(cors);

  let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
  println!("Server is running on {}", addr);
  axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
    .await
    .unwrap();
}
