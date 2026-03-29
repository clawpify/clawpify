use axum::{
  extract::{Path, Query, State},
  http::StatusCode,
  middleware,
  routing::{get, post},
  Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use super::extractors::OrgId;
use super::state::AppState;
use crate::dto::contracts::{
  valid_contract_status, valid_contract_type, valid_payout_method, ContractCreateRequest,
  ContractPatchRequest, PayoutCreateRequest, RunExpiryRequest,
};
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::models::contract_payout::ContractPayout;
use crate::models::contracts::Contract;
use crate::repositories::contract_payouts;
use crate::repositories::contracts as contract_repo;
use crate::repositories::pagination::Pagination;

const CONTRACT_NOT_FOUND: &str = "Contract not found";
const CONSIGNOR_NOT_FOUND: &str = "Consignor not found";

#[derive(Deserialize)]
struct ListContractsQuery {
  consignor_id: Option<Uuid>,
  status: Option<String>,
  limit: Option<i64>,
  offset: Option<i64>,
}

async fn load_contract(state: &AppState, org_id: &str, id: Uuid) -> Result<Contract, ApiError> {
  contract_repo::get_by_id(&state.pool, org_id, id)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found(CONTRACT_NOT_FOUND))
}

fn validate_new_contract(body: &ContractCreateRequest) -> Result<(), ApiError> {
  if !valid_contract_type(body.contract_type.as_str()) {
    return Err(error::bad_request("Invalid contract_type"));
  }
  if body.start_at >= body.end_at {
    return Err(error::bad_request("start_at must be before end_at"));
  }
  if body.consignor_split_bps + body.store_split_bps != 10000 {
    return Err(error::bad_request("splits must sum to 10000 bps"));
  }
  Ok(())
}

fn validate_payout_request(body: &PayoutCreateRequest) -> Result<(), ApiError> {
  if body.payout_index != 1 && body.payout_index != 2 {
    return Err(error::bad_request("payout_index must be 1 or 2"));
  }
  if !valid_payout_method(body.method.as_str()) {
    return Err(error::bad_request("Invalid payout method"));
  }
  if body.payout_index == 1 && body.amount_cents < 1000 {
    return Err(error::bad_request(
      "First payout (index 1) must be at least 1000 cents",
    ));
  }
  Ok(())
}

pub fn routes() -> Router<AppState> {
  Router::new()
    .route("/contracts", get(list_contracts).post(create_contract))
    .route(
      "/contracts/:id",
      get(get_contract).patch(patch_contract),
    )
    .route(
      "/contracts/:id/payouts",
      get(list_payouts).post(create_payout),
    )
    .route("/contracts/:id/summary", get(contract_summary))
    .route("/contracts/:id/run-expiry-rules", post(run_expiry_rules))
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn list_contracts(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Query(q): Query<ListContractsQuery>,
) -> Result<Json<Vec<Contract>>, ApiError> {
  let page = Pagination::new(q.limit, q.offset);
  let status = q.status.as_deref();
  if let Some(s) = status {
    if !valid_contract_status(s) {
      return Err(error::bad_request("Invalid status filter"));
    }
  }
  let rows = contract_repo::list(
    &state.pool,
    org_id.as_ref(),
    q.consignor_id,
    status,
    page,
  )
  .await
  .map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn create_contract(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Json(body): Json<ContractCreateRequest>,
) -> Result<(StatusCode, Json<Contract>), ApiError> {
  validate_new_contract(&body)?;
  let exists = contract_repo::consignor_in_org(&state.pool, org_id.as_ref(), body.consignor_id)
    .await
    .map_err(error::db_error)?;
  if !exists {
    return Err(error::not_found(CONSIGNOR_NOT_FOUND));
  }
  let row = contract_repo::create(&state.pool, org_id.as_ref(), body)
    .await
    .map_err(error::db_error)?;
  Ok((StatusCode::CREATED, Json(row)))
}

async fn get_contract(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(id): Path<Uuid>,
) -> Result<Json<Contract>, ApiError> {
  let row = load_contract(&state, org_id.as_ref(), id).await?;
  Ok(Json(row))
}

async fn patch_contract(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(id): Path<Uuid>,
  Json(body): Json<ContractPatchRequest>,
) -> Result<Json<Contract>, ApiError> {
  if let Some(ref s) = body.status {
    if !valid_contract_status(s) {
      return Err(error::bad_request("Invalid status"));
    }
  }
  let row = contract_repo::update(&state.pool, org_id.as_ref(), id, body)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found(CONTRACT_NOT_FOUND))?;
  Ok(Json(row))
}

async fn list_payouts(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(contract_id): Path<Uuid>,
) -> Result<Json<Vec<ContractPayout>>, ApiError> {
  load_contract(&state, org_id.as_ref(), contract_id).await?;
  let rows =
    contract_payouts::list_for_contract(&state.pool, org_id.as_ref(), contract_id)
      .await
      .map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn create_payout(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(contract_id): Path<Uuid>,
  Json(body): Json<PayoutCreateRequest>,
) -> Result<(StatusCode, Json<ContractPayout>), ApiError> {
  load_contract(&state, org_id.as_ref(), contract_id).await?;
  validate_payout_request(&body)?;
  let n = contract_payouts::count_for_contract(&state.pool, contract_id)
    .await
    .map_err(error::db_error)?;
  if n >= 2 {
    return Err(error::bad_request("At most two payouts per contract"));
  }
  let row = contract_payouts::create(
    &state.pool,
    org_id.as_ref(),
    contract_id,
    body.amount_cents,
    body.method.as_str(),
    body.payout_index,
  )
  .await
  .map_err(|e| {
    if let sqlx::Error::Database(ref d) = e {
      if d.is_unique_violation() {
        return error::conflict("Duplicate payout_index for this contract");
      }
    }
    error::db_error(e)
  })?;
  Ok((StatusCode::CREATED, Json(row)))
}

async fn contract_summary(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(id): Path<Uuid>,
) -> Result<Json<contract_repo::ContractSummary>, ApiError> {
  let row = contract_repo::contract_summary(&state.pool, org_id.as_ref(), id)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found(CONTRACT_NOT_FOUND))?;
  Ok(Json(row))
}

async fn run_expiry_rules(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(id): Path<Uuid>,
  Json(body): Json<RunExpiryRequest>,
) -> Result<Json<contract_repo::RunExpiryOutcome>, ApiError> {
  let as_of = body.as_of.unwrap_or_else(chrono::Utc::now);
  let contract = load_contract(&state, org_id.as_ref(), id).await?;
  if as_of <= contract.end_at {
    return Err(error::bad_request("as_of must be after contract end_at"));
  }
  let outcome = contract_repo::run_expiry_rules(&state.pool, org_id.as_ref(), id, as_of)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found(CONTRACT_NOT_FOUND))?;
  Ok(Json(outcome))
}
