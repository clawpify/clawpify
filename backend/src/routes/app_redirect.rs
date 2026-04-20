use axum::{
  extract::State,
  response::{IntoResponse, Redirect},
  routing::get,
  Router,
};

use super::spa_redirects::util;
use super::state::AppState;
use crate::error::ApiError;

pub fn routes() -> Router<AppState> {
  Router::new().route("/go/app", get(go_app))
}

#[utoipa::path(
  get,
  path = "/go/app",
  tag = "redirects",
  responses(
    (status = 307, description = "Redirect to SPA /app"),
    (status = 400, description = "Bad request", body = ErrorEnvelope)
  )
)]
async fn go_app(State(state): State<AppState>) -> Result<impl IntoResponse, ApiError> {
  let origin = util::app_public_origin_str(&state)?;
  let target = util::absolute_url_from_origin(origin, "/app")?;
  Ok(Redirect::temporary(&target))
}

#[derive(utoipa::OpenApi)]
#[openapi(paths(go_app))]
pub struct AppRedirectOpenApiDoc;
