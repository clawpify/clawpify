use axum::{
  extract::State,
  response::{IntoResponse, Redirect},
  routing::get,
  Router,
};
use url::Url;

use super::state::AppState;
use crate::error::{self, ApiError};

pub fn routes() -> Router<AppState> {
  Router::new().route("/go/app", get(go_app))
}

fn absolute_url(origin: &str, path: &str) -> Result<String, ApiError> {
  let base =
    Url::parse(origin).map_err(|_| error::bad_request("APP_PUBLIC_ORIGIN must be a valid URL with scheme"))?;
  let path = path.trim_start_matches('/');
  let joined = base.join(path).map_err(|_| error::internal("redirect url join failed"))?;
  Ok(joined.into())
}

async fn go_app(State(state): State<AppState>) -> Result<impl IntoResponse, ApiError> {
  let origin = state.app_public_origin.as_deref().ok_or_else(|| {
    error::service_unavailable(
      "APP_PUBLIC_ORIGIN is not set; configure it to the SPA origin (e.g. http://127.0.0.1:3001)",
    )
  })?;

  let target = absolute_url(origin, "/app")?;
  Ok(Redirect::temporary(&target))
}
