use axum::{
  extract::{Query, State},
  http::StatusCode,
  middleware,
  routing::get,
  Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use super::extractors::{OrgId, UserId};
use super::state::AppState;
use crate::dto::intake::{PhoneBindingResponse, UpsertPhoneBindingRequest};
use crate::dto::intake_batches::IntakeBatchCreateRequest;
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::models::intake_batch::IntakeBatch;
use crate::repositories::intake_batches;
use crate::repositories::intake_phone_bindings;
use crate::repositories::pagination::Pagination;
use crate::util::phone::parse_e164;

pub fn routes() -> Router<AppState> {
  Router::new()
    .route(
      "/intake/phone-binding",
      get(get_bindings).put(put_binding).delete(delete_binding),
    )
    .route("/intake/batches", get(list_batches).post(create_batch))
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

#[derive(Deserialize)]
struct ListBatchesQuery {
  consignor_id: Option<Uuid>,
  limit: Option<i64>,
  offset: Option<i64>,
}

async fn list_batches(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Query(q): Query<ListBatchesQuery>,
) -> Result<Json<Vec<IntakeBatch>>, ApiError> {
  let page = Pagination::new(q.limit, q.offset);
  let rows =
    intake_batches::list(&state.pool, org_id.as_ref(), q.consignor_id, page)
      .await
      .map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn create_batch(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Json(body): Json<IntakeBatchCreateRequest>,
) -> Result<(StatusCode, Json<IntakeBatch>), ApiError> {
  if body.box_count < 0 || body.box_count > 20 {
    return Err(error::bad_request("box_count must be 0..=20"));
  }
  let row = intake_batches::create(&state.pool, org_id.as_ref(), body)
    .await
    .map_err(error::db_error)?;
  Ok((StatusCode::CREATED, Json(row)))
}

async fn get_bindings(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
) -> Result<Json<Vec<PhoneBindingResponse>>, ApiError> {
  let rows = intake_phone_bindings::list_for_org(&state.pool, org_id.as_ref())
    .await
    .map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn put_binding(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  UserId(uid): UserId,
  Json(body): Json<UpsertPhoneBindingRequest>,
) -> Result<Json<PhoneBindingResponse>, ApiError> {
  let phone = parse_e164(&body.phone_e164).map_err(error::bad_request)?;

  if intake_phone_bindings::phone_taken_by_other(
    &state.pool,
    &phone,
    org_id.as_ref(),
    uid.as_ref(),
  )
  .await
  .map_err(error::db_error)?
  {
    return Err(error::bad_request(
      "That phone is already linked to another account or organization",
    ));
  }

  let row = intake_phone_bindings::upsert_for_user(
    &state.pool,
    org_id.as_ref(),
    uid.as_ref(),
    &phone,
  )
  .await
  .map_err(|e| {
    if let sqlx::Error::Database(ref d) = e {
      if d.is_unique_violation() {
        return error::conflict("Phone conflict");
      }
    }
    error::db_error(e)
  })?;

  Ok(Json(row))
}

async fn delete_binding(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  UserId(uid): UserId,
) -> Result<Json<serde_json::Value>, ApiError> {
  let deleted =
    intake_phone_bindings::delete_for_user(&state.pool, org_id.as_ref(), uid.as_ref())
      .await
      .map_err(error::db_error)?;
  if !deleted {
    return Err(error::not_found("No phone binding for this user"));
  }
  Ok(Json(serde_json::json!({ "ok": true })))
}
