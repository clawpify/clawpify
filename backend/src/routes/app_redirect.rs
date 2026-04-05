use axum::{
  extract::State,
  response::{IntoResponse, Redirect},
  routing::get,
  Router,
};

use super::spa_hop::util;
use super::state::AppState;
use crate::error::ApiError;

pub fn routes() -> Router<AppState> {
  Router::new().route("/go/app", get(go_app))
}

async fn go_app(State(state): State<AppState>) -> Result<impl IntoResponse, ApiError> {
  let origin = util::app_public_origin_str(&state)?;
  let target = util::absolute_url_from_origin(origin, "/app")?;
  Ok(Redirect::temporary(&target))
}
