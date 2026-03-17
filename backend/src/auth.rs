use axum::http::HeaderMap;

use crate::error::{self, ApiError};

pub fn get_org_id(headers: &HeaderMap) -> Result<String, ApiError> {
  headers
    .get("X-Internal-Org-Id")
    .and_then(|v| v.to_str().ok())
    .map(String::from)
    .ok_or_else(|| error::bad_request("Org required"))
}
