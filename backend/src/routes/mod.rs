mod activity;
mod citation;
mod stores;
mod subscribers;
mod visibility;

use axum::{
  middleware,
  routing::{get, put},
  Extension, Json, Router,
};
use serde::Serialize;
use sqlx::PgPool;

use crate::middleware as mw;

#[derive(Serialize)]
struct ApiResponse {
  ok: bool,
  message: &'static str,
}

fn health_routes() -> Router<()> {
  Router::new().route(
    "/health",
    get(|| async { Json(serde_json::json!({ "ok": true, "service": "clawpify-backend" })) }),
  )
}

fn placeholder_routes() -> Router<()> {
  Router::new()
    .route(
      "/radar",
      get(|| async {
        Json(ApiResponse {
          ok: true,
          message: "radar",
        })
      }),
    )
    .route(
      "/shield",
      put(|| async {
        Json(ApiResponse {
          ok: true,
          message: "shield",
        })
      }),
    )
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

pub fn api_router(pool: PgPool, rate_limit_pool: Option<PgPool>) -> Router {
  let api = Router::new()
    .merge(health_routes())
    .merge(citation::routes())
    .merge(stores::routes())
    .merge(visibility::routes())
    .merge(activity::routes())
    .merge(subscribers::routes())
    .merge(placeholder_routes());

  Router::new()
    .nest("/api", api)
    .layer(Extension(pool))
    .layer(Extension(rate_limit_pool))
}
