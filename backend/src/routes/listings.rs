use axum::{
  extract::{Path, Query, State},
  http::StatusCode,
  middleware,
  routing::get,
  Json, Router,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use super::extractors::{OrgId, UserId};
use super::state::AppState;
use crate::dto::listings::{CreateListingRequest, UpdateListingRequest};
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::models::consignment_listing::ConsignmentListing;
use crate::repositories::contracts as contract_repo;
use crate::repositories::{listings, pagination::Pagination};

const LISTING_NOT_FOUND: &str = "Listing not found";
const CONTRACT_NOT_FOUND: &str = "Contract not found";

#[derive(Deserialize)]
struct ListListingsQuery {
  status: Option<String>,
  limit: Option<i64>,
  offset: Option<i64>,
}

pub fn routes() -> Router<AppState> {
  Router::new()
    .route("/listings", get(list_listings).post(create_listing))
    .route(
      "/listings/:id",
      get(get_listing)
        .patch(update_listing)
        .delete(delete_listing),
    )
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

fn valid_acceptance(s: &str) -> bool {
  matches!(s, "pending" | "accepted" | "declined")
}

fn valid_disposition(s: &str) -> bool {
  matches!(
    s,
    "pickup_eligible" | "donate_eligible" | "donated" | "picked_up"
  )
}

fn check_listing_enum_fields(
  acceptance_status: Option<&str>,
  post_contract_disposition: Option<&str>,
) -> Result<(), ApiError> {
  if let Some(s) = acceptance_status {
    if !valid_acceptance(s) {
      return Err(error::bad_request("Invalid acceptance_status"));
    }
  }
  if let Some(s) = post_contract_disposition {
    if !valid_disposition(s) {
      return Err(error::bad_request("Invalid post_contract_disposition"));
    }
  }
  Ok(())
}

async fn align_contract_consignor_create(
  pool: &PgPool,
  org_id: &str,
  body: &mut CreateListingRequest,
) -> Result<(), ApiError> {
  let Some(cid) = body.contract_id else {
    return Ok(());
  };
  let cc = contract_repo::get_consignor_id(pool, org_id, cid)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found(CONTRACT_NOT_FOUND))?;
  match body.consignor_id {
    Some(co) if co != cc => Err(error::bad_request(
      "consignor_id does not match contract",
    )),
    Some(_) => Ok(()),
    None => {
      body.consignor_id = Some(cc);
      Ok(())
    }
  }
}

async fn align_contract_consignor_update(
  pool: &PgPool,
  org_id: &str,
  listing: &ConsignmentListing,
  body: &mut UpdateListingRequest,
) -> Result<(), ApiError> {
  let eff_contract = body.contract_id.or(listing.contract_id);
  let eff_consignor = body.consignor_id.or(listing.consignor_id);
  let Some(cid) = eff_contract else {
    return Ok(());
  };
  let cc = contract_repo::get_consignor_id(pool, org_id, cid)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found(CONTRACT_NOT_FOUND))?;
  match eff_consignor {
    Some(co) if co != cc => Err(error::bad_request(
      "consignor_id does not match contract",
    )),
    None => {
      body.consignor_id = Some(cc);
      Ok(())
    }
    _ => Ok(()),
  }
}

async fn list_listings(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Query(q): Query<ListListingsQuery>,
) -> Result<Json<Vec<ConsignmentListing>>, ApiError> {
  let page = Pagination::new(q.limit, q.offset);
  let status = q.status.as_deref();
  let rows = listings::list_by_org(&state.pool, org_id.as_ref(), status, page)
    .await
    .map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn create_listing(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  UserId(uid): UserId,
  mut body: Json<CreateListingRequest>,
) -> Result<(StatusCode, Json<ConsignmentListing>), ApiError> {
  check_listing_enum_fields(
    body.acceptance_status.as_deref(),
    body.post_contract_disposition.as_deref(),
  )?;
  align_contract_consignor_create(&state.pool, org_id.as_ref(), &mut body).await?;
  let row = listings::create(
    &state.pool,
    org_id.as_ref(),
    Some(uid.as_ref()),
    body.0,
  )
  .await
  .map_err(error::db_error)?;
  Ok((StatusCode::CREATED, Json(row)))
}

async fn get_listing(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(id): Path<Uuid>,
) -> Result<Json<ConsignmentListing>, ApiError> {
  let row = listings::get_by_id(&state.pool, org_id.as_ref(), id)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found(LISTING_NOT_FOUND))?;
  Ok(Json(row))
}

async fn update_listing(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(id): Path<Uuid>,
  mut body: Json<UpdateListingRequest>,
) -> Result<Json<ConsignmentListing>, ApiError> {
  check_listing_enum_fields(
    body.acceptance_status.as_deref(),
    body.post_contract_disposition.as_deref(),
  )?;
  let listing = listings::get_by_id(&state.pool, org_id.as_ref(), id)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found(LISTING_NOT_FOUND))?;
  align_contract_consignor_update(&state.pool, org_id.as_ref(), &listing, &mut body).await?;
  let row = listings::update(&state.pool, org_id.as_ref(), id, body.0)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found(LISTING_NOT_FOUND))?;
  Ok(Json(row))
}

async fn delete_listing(
  State(state): State<AppState>,
  OrgId(org_id): OrgId,
  Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
  let deleted = listings::delete(&state.pool, org_id.as_ref(), id)
    .await
    .map_err(error::db_error)?;
  if !deleted {
    return Err(error::not_found(LISTING_NOT_FOUND));
  }
  Ok(Json(serde_json::json!({ "ok": true })))
}
