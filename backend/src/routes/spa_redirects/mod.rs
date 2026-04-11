//! HTTP redirects from this API to the frontend SPA (e.g. OAuth return URLs that must hit the
//! public API host, then land on `/app` with a fixed query key).

mod ebay;
pub(crate) mod util;

pub use ebay::SpaRedirectsOpenApiDoc;

use axum::Router;

use super::state::AppState;

pub fn routes() -> Router<AppState> {
  Router::new().merge(ebay::routes())
}
