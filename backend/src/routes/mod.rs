mod activity;
mod app_redirect;
mod spa_hop;
mod consignors;
mod contracts;
mod ebay;
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

use axum::Router;
use sqlx::PgPool;
use utoipa_swagger_ui::SwaggerUi;

fn core_routes() -> Router<AppState> {
  Router::new()
    .merge(health::routes())
    .merge(spa_hop::routes())
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
