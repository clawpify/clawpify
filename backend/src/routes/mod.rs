mod activity;
mod intake;
mod listings;
mod llm;
mod stores;
mod subscribers;
mod webhooks;

use axum::{
  routing::get,
  Extension, Json, Router,
};
use sqlx::PgPool;

pub fn api_router(pool: PgPool) -> Router {
  let api = Router::new()
    .merge(health_routes())
    .merge(stores::routes())
    .merge(listings::routes())
    .merge(intake::routes())
    .merge(webhooks::routes())
    .merge(activity::routes())
    .merge(subscribers::routes())
    .merge(llm::routes());

  Router::new()
    .nest("/api", api)
    .layer(Extension(pool))
}

fn health_routes() -> Router<()> {
  Router::new().route(
    "/health",
    get(|| async { Json(serde_json::json!({ "ok": true, "service": "clawpify-backend" })) }),
  )
}
