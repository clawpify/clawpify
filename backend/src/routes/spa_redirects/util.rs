use url::Url;

use crate::error::{self, ApiError};
use crate::routes::AppState;

pub(crate) fn app_public_origin_str(state: &AppState) -> Result<&str, ApiError> {
  state.app_public_origin.as_deref().ok_or_else(|| {
    error::service_unavailable(
      "APP_PUBLIC_ORIGIN is not set; configure it to the SPA origin (e.g. http://127.0.0.1:3001)",
    )
  })
}

pub(crate) fn absolute_url_from_origin(origin: &str, path: &str) -> Result<String, ApiError> {
  let base = Url::parse(origin)
    .map_err(|_| error::bad_request("APP_PUBLIC_ORIGIN must be a valid URL with scheme"))?;
  let path = path.trim_start_matches('/');
  let joined = base
    .join(path)
    .map_err(|_| error::internal("redirect url join failed"))?;
  Ok(joined.into())
}

/// SPA `/app` with a single fixed query pair (namespaced per integration, not user-controlled).
pub(crate) fn app_url_with_query_pair(
  origin: &str,
  key: &str,
  value: &str,
) -> Result<String, ApiError> {
  let mut u = Url::parse(origin)
    .map_err(|_| error::bad_request("APP_PUBLIC_ORIGIN must be a valid URL with scheme"))?;
  u.path_segments_mut()
    .map_err(|_| error::internal("redirect url path failed"))?
    .push("app");
  u.query_pairs_mut().append_pair(key, value);
  Ok(u.into())
}

pub(crate) fn app_path_url_with_query_pair(
  origin: &str,
  app_path: &str,
  key: &str,
  value: &str,
) -> Result<String, ApiError> {
  let mut u = Url::parse(origin)
    .map_err(|_| error::bad_request("APP_PUBLIC_ORIGIN must be a valid URL with scheme"))?;
  let path = app_path.trim_start_matches('/');
  u.path_segments_mut()
    .map_err(|_| error::internal("redirect url path failed"))?
    .extend(path.split('/').filter(|segment| !segment.is_empty()));
  u.query_pairs_mut().append_pair(key, value);
  Ok(u.into())
}
