use axum::{
  extract::{Path, Query, State},
  http::{HeaderMap, StatusCode},
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
use crate::repositories::api_idempotency;
use crate::repositories::contract_payouts;
use crate::repositories::contracts as contract_repo;
use crate::repositories::pagination::Pagination;

const CONTRACT_NOT_FOUND: &str = "Contract not found";
const CONSIGNOR_NOT_FOUND: &str = "Consignor not found";
const OP_CONTRACT_CREATE: &str = "contract_create";

fn parse_idempotency_key(headers: &HeaderMap) -> Result<Option<&str>, ApiError> {
  let raw = headers
    .get("idempotency-key")
    .or_else(|| headers.get("Idempotency-Key"));
  let Some(raw) = raw else {
    return Ok(None);
  };
  let s = raw
    .to_str()
    .map_err(|_| error::bad_request("Invalid Idempotency-Key header encoding"))?;
  let t = s.trim();
  if t.is_empty() {
    return Err(error::bad_request("Idempotency-Key cannot be empty"));
  }
  if t.len() > 256 {
    return Err(error::bad_request("Idempotency-Key too long"));
  }
  Ok(Some(t))
}

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
  headers: HeaderMap,
  Json(body): Json<ContractCreateRequest>,
) -> Result<(StatusCode, Json<Contract>), ApiError> {
  validate_new_contract(&body)?;
  if let Some(key) = parse_idempotency_key(&headers)? {
    return create_contract_idempotent(&state, org_id.as_ref(), key, body).await;
  }
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

async fn create_contract_idempotent(
  state: &AppState,
  org_id: &str,
  idem_key: &str,
  body: ContractCreateRequest,
) -> Result<(StatusCode, Json<Contract>), ApiError> {
  let hash = crate::util::idempotency::body_hash(&body).map_err(|_| {
    error::bad_request("Invalid request body for idempotency")
  })?;

  let scope = api_idempotency::IdempotencyScope {
    client_key: idem_key,
    operation: OP_CONTRACT_CREATE,
  };
  let lock = api_idempotency::advisory_key_bits(org_id, idem_key, scope.operation);

  let mut tx = state.pool.begin().await.map_err(error::db_error)?;
  api_idempotency::advisory_lock(&mut tx, lock)
    .await
    .map_err(error::db_error)?;

  if let Some((stored_hash, status_i, json_body)) =
    api_idempotency::lookup(&mut tx, org_id, scope)
      .await
      .map_err(error::db_error)?
  {
    if stored_hash != hash {
      return Err(error::idempotency_mismatch());
    }
    let contract: Contract =
      serde_json::from_value(json_body).map_err(error::internal)?;
    let code = u16::try_from(status_i).unwrap_or(201);
    return Ok((
      StatusCode::from_u16(code).unwrap_or(StatusCode::CREATED),
      Json(contract),
    ));
  }

  let exists =
    contract_repo::consignor_in_org(&mut *tx, org_id, body.consignor_id)
      .await
      .map_err(error::db_error)?;
  if !exists {
    return Err(error::not_found(CONSIGNOR_NOT_FOUND));
  }

  let row = contract_repo::create(&mut *tx, org_id, body)
    .await
    .map_err(error::db_error)?;

  let status_u = StatusCode::CREATED.as_u16();
  let v = serde_json::to_value(&row).map_err(error::internal)?;
  api_idempotency::store(&mut tx, org_id, scope, &hash, status_u, &v)
    .await
    .map_err(error::db_error)?;
  tx.commit().await.map_err(error::db_error)?;
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
  headers: HeaderMap,
  Json(body): Json<PayoutCreateRequest>,
) -> Result<(StatusCode, Json<ContractPayout>), ApiError> {
  load_contract(&state, org_id.as_ref(), contract_id).await?;
  validate_payout_request(&body)?;
  if let Some(key) = parse_idempotency_key(&headers)? {
    return create_payout_idempotent(
      &state,
      org_id.as_ref(),
      contract_id,
      key,
      body,
    )
    .await;
  }
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

async fn create_payout_idempotent(
  state: &AppState,
  org_id: &str,
  contract_id: Uuid,
  idem_key: &str,
  body: PayoutCreateRequest,
) -> Result<(StatusCode, Json<ContractPayout>), ApiError> {
  let hash = crate::util::idempotency::body_hash(&body).map_err(|_| {
    error::bad_request("Invalid request body for idempotency")
  })?;

  let op = format!("payout_create:{contract_id}");
  let scope = api_idempotency::IdempotencyScope {
    client_key: idem_key,
    operation: op.as_str(),
  };
  let lock = api_idempotency::advisory_key_bits(org_id, idem_key, &op);

  let mut tx = state.pool.begin().await.map_err(error::db_error)?;
  api_idempotency::advisory_lock(&mut tx, lock)
    .await
    .map_err(error::db_error)?;

  if let Some((stored_hash, status_i, json_body)) =
    api_idempotency::lookup(&mut tx, org_id, scope)
      .await
      .map_err(error::db_error)?
  {
    if stored_hash != hash {
      return Err(error::idempotency_mismatch());
    }
    let row: ContractPayout =
      serde_json::from_value(json_body).map_err(error::internal)?;
    let code = u16::try_from(status_i).unwrap_or(201);
    return Ok((
      StatusCode::from_u16(code).unwrap_or(StatusCode::CREATED),
      Json(row),
    ));
  }

  let n = contract_payouts::count_for_contract(&mut *tx, contract_id)
    .await
    .map_err(error::db_error)?;
  if n >= 2 {
    return Err(error::bad_request("At most two payouts per contract"));
  }

  let row = contract_payouts::create(
    &mut *tx,
    org_id,
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

  let status_u = StatusCode::CREATED.as_u16();
  let v = serde_json::to_value(&row).map_err(error::internal)?;
  api_idempotency::store(&mut tx, org_id, scope, &hash, status_u, &v)
    .await
    .map_err(error::db_error)?;
  tx.commit().await.map_err(error::db_error)?;
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
