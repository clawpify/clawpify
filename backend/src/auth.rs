use axum::http::HeaderMap;

use crate::error::{self, ApiError};

pub fn get_org_id(headers: &HeaderMap) -> Result<String, ApiError> {
  headers
    .get("X-Internal-Org-Id")
    .and_then(|v| v.to_str().ok())
    .map(String::from)
    .ok_or_else(|| error::bad_request("Org required"))
}

/// Clerk subject / internal user id from the proxy (`X-Internal-User-Id`).
pub fn get_user_id(headers: &HeaderMap) -> Result<String, ApiError> {
  headers
    .get("X-Internal-User-Id")
    .and_then(|v| v.to_str().ok())
    .map(String::from)
    .ok_or_else(|| error::bad_request("User required"))
}

/// Storage key for [`crate::routes::activity`] only: real org id when the JWT has an active org;
/// otherwise `user:<clerk_sub>` so signed-in users without Clerk Organizations still work.
pub fn org_scope_for_activity(headers: &HeaderMap) -> Result<String, ApiError> {
  if let Some(org) = headers
    .get("X-Internal-Org-Id")
    .and_then(|v| v.to_str().ok())
    .map(String::from)
  {
    if !org.is_empty() {
      return Ok(org);
    }
  }
  let uid = get_user_id(headers)?;
  Ok(format!("user:{}", uid))
}
