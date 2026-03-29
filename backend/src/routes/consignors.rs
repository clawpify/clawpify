use axum::{
  extract::{Path, Query, State},
  http::StatusCode,
  middleware,
  routing::get,
  Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use super::extractors::OrgId;
use super::state::AppState;
use crate::dto::consignors::{
  validate_payout_method_opt, CreateConsignorRequest, UpdateConsignorRequest,
};
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::models::consignor::Consignor;
use crate::repositories::{consignors, pagination::Pagination};
use crate::util::phone::parse_e164;

const CONSIGNOR_NOT_FOUND: &str = "Consignor not found";

#[derive(Deserialize)]
struct ListQuery {
  limit: Option<i64>,
  offset: Option<i64>,
}

pub fn routes() -> Router<AppState> {
  Router::new()
    .route("/consignors", get(list_consignors).post(create_consignor))
    .route(
      "/consignors/:id",
      get(get_consignor)
        .patch(update_consignor)
        .delete(delete_consignor),
    )
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn list_consignors(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Query(q): Query<ListQuery>,
) -> Result<Json<Vec<Consignor>>, ApiError> {
  let page = Pagination::new(q.limit, q.offset);
  let rows = consignors::list_by_org(&state.pool, org_id.as_ref(), page)
    .await
    .map_err(error::db_error)?;
  Ok(Json(rows))
}

fn normalize_phone_e164(raw: &str) -> Result<String, ApiError> {
  parse_e164(raw).map_err(error::bad_request)
}

async fn create_consignor(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  mut body: Json<CreateConsignorRequest>,
) -> Result<(StatusCode, Json<Consignor>), ApiError> {
  body.display_name = body.display_name.trim().to_string();
  if body.display_name.is_empty() {
    return Err(error::bad_request("display_name required"));
  }
  validate_payout_method_opt(body.default_payout_method.as_ref())
    .map_err(error::bad_request)?;
  if let Some(ref raw) = body.phone_e164 {
    body.phone_e164 = Some(normalize_phone_e164(raw)?);
  }
  let row = consignors::create(&state.pool, org_id.as_ref(), body.0)
    .await
    .map_err(error::db_error)?;
  Ok((StatusCode::CREATED, Json(row)))
}

async fn get_consignor(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(id): Path<Uuid>,
) -> Result<Json<Consignor>, ApiError> {
  let row = consignors::get_by_id(&state.pool, org_id.as_ref(), id)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found(CONSIGNOR_NOT_FOUND))?;
  Ok(Json(row))
}

async fn update_consignor(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(id): Path<Uuid>,
  mut body: Json<UpdateConsignorRequest>,
) -> Result<Json<Consignor>, ApiError> {
  validate_payout_method_opt(body.default_payout_method.as_ref())
    .map_err(error::bad_request)?;
  if let Some(ref d) = body.display_name {
    let t = d.trim();
    if t.is_empty() {
      return Err(error::bad_request("display_name cannot be empty"));
    }
    body.display_name = Some(t.to_string());
  }
  if let Some(ref raw) = body.phone_e164 {
    body.phone_e164 = Some(normalize_phone_e164(raw)?);
  }
  let row = consignors::update(&state.pool, org_id.as_ref(), id, body.0)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found(CONSIGNOR_NOT_FOUND))?;
  Ok(Json(row))
}

async fn delete_consignor(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
  let n = consignors::count_contracts_for_consignor(&state.pool, org_id.as_ref(), id)
    .await
    .map_err(error::db_error)?;
  if n > 0 {
    return Err(error::conflict(
      "Consignor still has contracts; remove or reassign contracts first",
    ));
  }
  let deleted = consignors::delete(&state.pool, org_id.as_ref(), id)
    .await
    .map_err(error::db_error)?;
  if !deleted {
    return Err(error::not_found(CONSIGNOR_NOT_FOUND));
  }
  Ok(Json(serde_json::json!({ "ok": true })))
}
