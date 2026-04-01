use std::path::Path;

use axum::{
  body::{Body, Bytes},
  extract::{DefaultBodyLimit, Query, State},
  handler::Handler,
  http::{header, HeaderMap, StatusCode},
  middleware,
  response::Response,
  Json, Router,
};
use aws_sdk_s3::primitives::ByteStream;
use serde::{Deserialize, Serialize};
use url::form_urlencoded::Serializer;
use uuid::Uuid;

use super::extractors::{OrgId, UserId};
use super::state::AppState;
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::repositories::stored_images as stored_images_repo;

const MAX_BYTES: u64 = 16 * 1024 * 1024;
#[derive(Deserialize)]
pub struct UploadQuery {
  pub file_name: Option<String>,
  pub listing_id: Option<Uuid>,
}

#[derive(Serialize)]
pub struct UploadResult {
  pub key: String,
  pub byte_size: u64,
}

#[derive(Deserialize)]
pub struct KeyQuery {
  pub key: String,
}

pub fn routes() -> Router<AppState> {
  Router::new()
    .route(
      "/s3/objects",
      axum::routing::post(upload_object.layer(DefaultBodyLimit::max(MAX_BYTES as usize)))
        .get(download_object)
        .delete(delete_object),
    )
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

fn prefix(org: &str, user: &str) -> String {
  format!("uploads/{org}/{user}/")
}

fn owns_key(key: &str, org: &str, user: &str) -> bool {
  key.starts_with(&prefix(org, user))
}

/// Whether `storage_key` belongs to this org/user prefix (same rules as upload GET/DELETE).
pub(crate) fn storage_key_owned_by_user(key: &str, org: &str, user: &str) -> bool {
  owns_key(key, org, user)
}

/// Same-origin path for cookie-auth BFF clients (`GET` returns object bytes).
pub(crate) fn stored_image_proxy_path(storage_key: &str) -> String {
  let q = Serializer::new(String::new())
    .append_pair("key", storage_key)
    .finish();
  format!("/api/s3/objects?{q}")
}

fn validate_key<'a>(raw: &'a str, org: &str, user: &str) -> Result<&'a str, ApiError> {
  let key = raw.trim();
  if key.is_empty() {
    return Err(error::bad_request("key required"));
  }
  if !owns_key(key, org, user) {
    return Err(error::bad_request("forbidden key"));
  }
  Ok(key)
}

fn s3<'a>(state: &'a AppState) -> Result<(&'a aws_sdk_s3::Client, &'a str), ApiError> {
  match (&state.s3_client, &state.s3_bucket) {
    (Some(c), Some(b)) => Ok((c, b.as_str())),
    _ => Err(error::service_unavailable("Object storage not configured (set BUCKET_* env)")),
  }
}

fn basename(file_name: &str) -> String {
  let s: String = Path::new(file_name.trim())
    .file_name()
    .and_then(|n| n.to_str())
    .unwrap_or("file")
    .chars()
    .filter(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-' | '_'))
    .take(120)
    .collect();
  if s.is_empty() {
    "file".to_string()
  } else {
    s
  }
}

fn content_type_for_upload(headers: &HeaderMap) -> Result<&str, ApiError> {
  let raw = headers
    .get(header::CONTENT_TYPE)
    .and_then(|v| v.to_str().ok())
    .map(str::trim)
    .filter(|s| !s.is_empty())
    .ok_or_else(|| error::bad_request("Content-Type required"))?;
  Ok(raw.split(';').next().unwrap_or(raw).trim())
}

async fn upload_object(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  UserId(user_id): UserId,
  Query(q): Query<UploadQuery>,
  headers: HeaderMap,
  body: Bytes,
) -> Result<Json<UploadResult>, ApiError> {
  let (client, bucket) = s3(&state)?;

  if let Some(lid) = q.listing_id {
    let _listing = crate::repositories::listings::get_by_id(&state.pool, org_id.as_ref(), lid)
      .await
      .map_err(error::db_error)?
      .ok_or_else(|| error::not_found("Listing not found"))?;
  }

  let byte_size = body.len() as u64;
  if byte_size == 0 || byte_size > MAX_BYTES {
    return Err(error::bad_request("body size out of range"));
  }
  let content_type = content_type_for_upload(&headers)?;
  let name_hint = q.file_name.as_deref().unwrap_or("upload");
  let safe_name = basename(name_hint);
  let key = format!("{}{}_{}", prefix(&org_id, &user_id), Uuid::new_v4(), safe_name);
  let len_i64 = i64::try_from(byte_size).map_err(|_| error::bad_request("body too large"))?;

  client
    .put_object()
    .bucket(bucket)
    .key(&key)
    .content_type(content_type)
    .body(ByteStream::from(body))
    .send()
    .await
    .map_err(|e| {
      tracing::error!(%key, %e, "put_object");
      error::internal(e)
    })?;

  stored_images_repo::insert(
    &state.pool,
    &org_id,
    &user_id,
    &key,
    content_type,
    len_i64,
    &safe_name,
    q.listing_id,
  )
  .await
  .map_err(|e| {
    tracing::error!(%key, %e, "stored_images insert");
    error::internal(e)
  })?;

  Ok(Json(UploadResult { key, byte_size }))
}

async fn download_object(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  UserId(user_id): UserId,
  Query(q): Query<KeyQuery>,
) -> Result<Response, ApiError> {
  let (client, bucket) = s3(&state)?;
  let key = validate_key(&q.key, &org_id, &user_id)?;

  let out = client
    .get_object()
    .bucket(bucket)
    .key(key)
    .send()
    .await
    .map_err(|e| {
      tracing::error!(key = %key, %e, "get_object");
      error::internal(e)
    })?;

  if let Some(len) = out.content_length() {
    if len > 0 && len as u64 > MAX_BYTES {
      return Err(error::bad_request("object too large"));
    }
  }

  let content_type = out
    .content_type()
    .filter(|s| !s.is_empty())
    .map(|s| s.to_string())
    .unwrap_or_else(|| "application/octet-stream".to_string());

  let body = out
    .body
    .collect()
    .await
    .map_err(|e| {
      tracing::error!(key = %key, %e, "get_object body");
      error::internal(e)
    })?
    .into_bytes();

  if body.len() as u64 > MAX_BYTES {
    return Err(error::bad_request("object too large"));
  }

  Response::builder()
    .status(StatusCode::OK)
    .header(header::CONTENT_TYPE, content_type)
    .body(Body::from(body))
    .map_err(|e| error::internal(e))
}

async fn delete_object(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  UserId(user_id): UserId,
  Query(q): Query<KeyQuery>,
) -> Result<StatusCode, ApiError> {
  let (client, bucket) = s3(&state)?;
  let key = validate_key(&q.key, &org_id, &user_id)?;

  client
    .delete_object()
    .bucket(bucket)
    .key(key)
    .send()
    .await
    .map_err(|e| {
      tracing::error!(key = %key, %e, "delete_object");
      error::internal(e)
    })?;

  stored_images_repo::delete_by_org_and_key(&state.pool, &org_id, key)
    .await
    .map_err(|e| {
      tracing::error!(key = %key, %e, "stored_images delete");
      error::internal(e)
    })?;

  Ok(StatusCode::NO_CONTENT)
}
