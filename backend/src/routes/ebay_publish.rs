use axum::{
  extract::{Path, State},
  middleware,
  routing::post,
  Json, Router,
};
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use super::extractors::OrgId;
use super::state::AppState;
use crate::error::{self, ApiError};
use crate::integrations::ebay::inventory::EbayInventory;
use crate::integrations::ebay::token_service::EbayTokenService;
use crate::middleware as mw;
use crate::repositories::{channel_connections, listing_publications, listings};

#[derive(Deserialize, ToSchema)]
pub struct PublishListingRequest {
  pub marketplace_id: String,         // marketplace ID
  pub category_id: String,            // category ID
  pub condition_id: String,           // condition ID
  pub fulfillment_policy_id: String,  // fulfillment policy ID
  pub payment_policy_id: String,      // payment policy ID
  pub return_policy_id: String,       // return policy ID
  pub merchant_location_key: String,  // merchant location key
}

pub fn routes() -> Router<AppState> {
  Router::new()
    .route(
      "/listings/:listing_id/publish/ebay",
      post(publish_listing_to_ebay),
    )
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn publish_listing_to_ebay(
  State(state): State<AppState>,
  org: OrgId,
  Path(listing_id): Path<Uuid>,
  Json(request): Json<PublishListingRequest>,
) -> Result<Json<serde_json::Value>, ApiError> {
  let crypto = state
    .token_crypto
    .as_ref()
    .ok_or_else(|| error::internal("CHANNEL_ENCRYPTION_KEY / token crypto"))?;

  let cfg = state
    .ebay_config
    .as_ref()
    .ok_or_else(|| error::internal("eBay not configured"))?;

  let org_id: &str = org.as_ref();

  let listing = listings::get_by_id(&state.pool, org_id, listing_id)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found("Listing not found"))?;

  let sku = listing.sku.clone();

  if sku.trim().is_empty() {
    return Err(error::bad_request("listing.sku required for eBay SKU"));
  }

  let ebay_row = channel_connections::get_ebay_secrets(&state.pool, org_id)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::bad_request("Connect eBay first"))?;

  let ts = EbayTokenService {
    pool: &state.pool,
    cfg,
    crypto,
  };

  let bearer = ts
    .bearer_for_org(org_id)
    .await
    .map_err(|e| ApiError::bad_request(e.to_string()))?;

  let inv = EbayInventory {
    cfg,
    access_token: &bearer,
  };

  let image_urls: Vec<String> =
    serde_json::from_value(listing.media_urls.clone()).unwrap_or_default();
  let price = format!("{:.2}", listing.price_cents as f64 / 100.0);

  inv
    .put_inventory_item(
      &sku,
      &listing.title,
      &listing.description_html,
      image_urls,
      &request.category_id,
      &request.condition_id,
    )
    .await
    .map_err(|e| ApiError::bad_request(e.to_string()))?;

  let offer_id = inv
    .create_offer(
      &sku,
      &request.marketplace_id,
      &request.category_id,
      &price,
      &listing.currency_code,
      &request.fulfillment_policy_id,
      &request.payment_policy_id,
      &request.return_policy_id,
      &request.merchant_location_key,
    )
    .await
    .map_err(|e| ApiError::bad_request(e.to_string()))?;

  let published = inv
    .publish_offer(&offer_id)
    .await
    .map_err(|e| ApiError::bad_request(e.to_string()))?;

  let snapshot = serde_json::json!({
    "sku": sku,
    "offerId": offer_id,
    "listingId": published.get("listingId"),
  });

  listing_publications::insert(
    &state.pool,
    listing.id,
    ebay_row.id,
    "ebay",
    "success",
    None,
    Some(snapshot.clone()),
    None,
  )
  .await
  .map_err(error::db_error)?;

  Ok(Json(snapshot))
}