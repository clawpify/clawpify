mod activity;
mod consignors;
mod contracts;
pub mod extractors;
mod intake;
mod listings;
mod llm;
mod state;
mod subscribers;
mod webhooks;

pub use state::AppState;

use axum::{routing::get, Json, Router};
use sqlx::PgPool;

/// API tree with [`AppState`] (database pool + future shared deps).
pub fn api_router(pool: PgPool) -> Router<AppState> {
  let state = AppState::new(pool);
  Router::new()
    .nest(
      "/api",
      Router::new()
        .merge(health_routes())
        .merge(listings::routes())
        .merge(consignors::routes())
        .merge(contracts::routes())
        .merge(intake::routes())
        .merge(webhooks::routes())
        .merge(activity::routes())
        .merge(subscribers::routes())
        .merge(llm::routes())
        .with_state(state),
    )
}

fn health_routes() -> Router<AppState> {
  Router::new().route(
    "/health",
    get(|| async { Json(serde_json::json!({ "ok": true, "service": "clawpify-backend" })) }),
  )
}
