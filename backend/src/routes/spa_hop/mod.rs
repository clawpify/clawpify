//! API → SPA redirect hops when the public host only reaches this server (e.g. ngrok → Rust).

mod ebay;
pub(crate) mod util;

use axum::Router;

use super::state::AppState;

pub fn routes() -> Router<AppState> {
  Router::new().merge(ebay::routes())
}
