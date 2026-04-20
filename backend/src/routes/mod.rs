mod activity;
mod app_redirect;
mod spa_redirects;
mod consignors;
mod contracts;
mod ebay;
mod ebay_publish;
pub mod extractors;
mod health;
mod intake;
mod listings;
mod llm;
mod openapi;
mod state;
mod subscribers;
mod webhooks;
mod s3;

pub use state::AppState;

use axum::{middleware::from_fn, Router};
use sqlx::PgPool;
use utoipa_swagger_ui::SwaggerUi;

use crate::middleware;

fn core_routes() -> Router<AppState> {
  Router::new()
    .merge(health::routes())
    .merge(spa_redirects::routes())
    .merge(app_redirect::routes())
    .merge(SwaggerUi::new("/swagger-ui").url("/openapi.json", openapi::openapi_spec()))
    .merge(listings::routes())
    .merge(consignors::routes())
    .merge(contracts::routes())
    .merge(intake::routes())
    .merge(webhooks::routes())
    .merge(activity::routes())
    .merge(subscribers::routes())
    .merge(llm::routes())
    .merge(s3::routes())
    .merge(ebay::routes())
    .merge(ebay_publish::routes())
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
    .layer(from_fn(middleware::inject_clerk_bearer_as_internal))
}
