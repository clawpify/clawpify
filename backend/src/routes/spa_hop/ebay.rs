use axum::{
  extract::State,
  response::{IntoResponse, Redirect},
  routing::get,
  Router,
};

use super::util;
use crate::routes::AppState;
use crate::error::ApiError;

const EBAY_OAUTH_QUERY_KEY: &str = "ebay_oauth";

pub fn routes() -> Router<AppState> {
  Router::new()
    .route("/go/oauth/ebay/declined", get(ebay_declined))
    .route("/go/oauth/ebay/success", get(ebay_success))
}

async fn ebay_declined(State(state): State<AppState>) -> Result<impl IntoResponse, ApiError> {
  let origin = util::app_public_origin_str(&state)?;
  let target = util::app_url_with_query_pair(origin, EBAY_OAUTH_QUERY_KEY, "declined")?;
  Ok(Redirect::temporary(&target))
}

async fn ebay_success(State(state): State<AppState>) -> Result<impl IntoResponse, ApiError> {
  let origin = util::app_public_origin_str(&state)?;
  let target = util::app_url_with_query_pair(origin, EBAY_OAUTH_QUERY_KEY, "connected")?;
  Ok(Redirect::temporary(&target))
}
