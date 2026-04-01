mod activity;
mod consignors;
mod contracts;
pub mod extractors;
mod health;
mod intake;
mod listings;
mod llm;
mod state;
mod subscribers;
mod webhooks;
mod s3;

pub use state::AppState;

use axum::{routing::get, Router};
use sqlx::PgPool;

fn core_routes() -> Router<AppState> {
  Router::new()
    .merge(health::routes())
    .route(
      "/openapi.json",
      get(|| async { axum::Json(health::openapi_spec()) }),
    )
    .merge(listings::routes())
    .merge(consignors::routes())
    .merge(contracts::routes())
    .merge(intake::routes())
    .merge(webhooks::routes())
    .merge(activity::routes())
    .merge(subscribers::routes())
    .merge(llm::routes())
    .merge(s3::routes())
}

/// API tree with [`AppState`] (database pool + future shared deps).
///
/// Served at `/api/v1/*` (canonical) and `/api/*` (legacy alias).
pub fn api_router(pool: PgPool) -> Router {
  let state = AppState::new(pool);
  Router::new()
    .nest(
      "/api/v1",
      core_routes().with_state(state.clone()),
    )
    .nest("/api", core_routes().with_state(state))
}
