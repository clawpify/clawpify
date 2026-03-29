//! Request extractors for headers validated by [`crate::auth`].

use async_trait::async_trait;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;

use crate::auth;
use crate::error::ApiError;

/// `X-Internal-Org-Id` — required for org-scoped inventory and contracts APIs.
#[derive(Debug)]
pub struct OrgId(pub String);

impl AsRef<str> for OrgId {
  fn as_ref(&self) -> &str {
    &self.0
  }
}

#[async_trait]
impl<S> FromRequestParts<S> for OrgId
where
  S: Send + Sync,
{
  type Rejection = ApiError;

  async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
    auth::get_org_id(&parts.headers).map(OrgId)
  }
}

/// `X-Internal-User-Id` — Clerk subject; required by [`crate::middleware::require_internal_auth`].
#[derive(Debug)]
pub struct UserId(pub String);

impl AsRef<str> for UserId {
  fn as_ref(&self) -> &str {
    &self.0
  }
}

#[async_trait]
impl<S> FromRequestParts<S> for UserId
where
  S: Send + Sync,
{
  type Rejection = ApiError;

  async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
    auth::get_user_id(&parts.headers).map(UserId)
  }
}

/// Org id for activity logging — real org or `user:<clerk_sub>` fallback.
#[derive(Debug)]
pub struct ActivityOrgScope(pub String);

impl AsRef<str> for ActivityOrgScope {
  fn as_ref(&self) -> &str {
    &self.0
  }
}

#[async_trait]
impl<S> FromRequestParts<S> for ActivityOrgScope
where
  S: Send + Sync,
{
  type Rejection = ApiError;

  async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
    auth::org_scope_for_activity(&parts.headers).map(ActivityOrgScope)
  }
}
