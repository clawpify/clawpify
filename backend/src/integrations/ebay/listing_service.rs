use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use super::account::{
  location_options, policy_options, validate_policy_selection, EbayAccount, EbayAccountError,
  EbayPolicyValidationError,
};
use super::config::EbayConfig;
use super::inventory::{CreateOfferRequest, EbayInventory, PutInventoryItemRequest};
use super::token_service::EbayTokenService;
use crate::crypto::tokens::TokenCrypto;
use crate::models::consignment_listing::ConsignmentListing;
use crate::repositories::{channel_connections, listing_publications, listings};

#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct EbayDraftRequest {
  pub marketplace_id: String,
  pub category_id: String,
  pub condition_id: String,
  pub fulfillment_policy_id: String,
  pub payment_policy_id: String,
  pub return_policy_id: String,
  pub merchant_location_key: Option<String>,
  pub quantity: Option<i64>,
  pub aspects: Option<Value>,
  pub brand: Option<String>,
  pub mpn: Option<String>,
  pub quantity_limit_per_buyer: Option<i64>,
  pub include_catalog_product_details: Option<bool>,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct EbayDraftResponse {
  pub publication_id: Uuid,
  pub offer_id: String,
  pub sku: String,
  pub reused_existing_offer: bool,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct EbayPublishResponse {
  pub publication_id: Uuid,
  pub offer_id: String,
  pub listing_id: Option<String>,
  pub response: Value,
}

pub struct EbayListingService<'a> {
  pub pool: &'a PgPool,
  pub cfg: &'a EbayConfig,
  pub crypto: &'a TokenCrypto,
}

impl<'a> EbayListingService<'a> {
  /// Create or reuse an unpublished eBay offer and persist it as a pending publication.
  pub async fn create_draft(
    &self,
    org_id: &str,
    listing_id: Uuid,
    mut req: EbayDraftRequest,
  ) -> Result<EbayDraftResponse, EbayListingServiceError> {
    let listing = listings::get_by_id(self.pool, org_id, listing_id)
      .await?
      .ok_or(EbayListingServiceError::NotFound)?;

    let sku = listing.sku.trim().to_string();

    if sku.is_empty() {
      return Err(EbayListingServiceError::BadRequest(
        "listing.sku required for eBay SKU".into(),
      ));
    }

    if listing.title.trim().is_empty() || listing.price_cents <= 0 {
      return Err(EbayListingServiceError::BadRequest(
        "listing title and positive price required".into(),
      ));
    }

    let connection = channel_connections::get_ebay_secrets(self.pool, org_id)
      .await?
      .ok_or_else(|| EbayListingServiceError::BadRequest("Connect eBay first".into()))?;

    let bearer = EbayTokenService {
      pool: self.pool,
      cfg: self.cfg,
      crypto: self.crypto,
    }
    .bearer_for_org(org_id)
    .await?;

    req.marketplace_id = req.marketplace_id.trim().to_string();
    req.category_id = req.category_id.trim().to_string();
    req.condition_id = req.condition_id.trim().to_string();
    req.fulfillment_policy_id = req.fulfillment_policy_id.trim().to_string();
    req.payment_policy_id = req.payment_policy_id.trim().to_string();
    req.return_policy_id = req.return_policy_id.trim().to_string();

    let account = EbayAccount {
      cfg: self.cfg,
      access_token: &bearer,
    };
    let setup = account.seller_setup(&req.marketplace_id, false).await?;
    let merchant_location_key = validate_draft_policy_selection(&setup, &req)?;
    req.merchant_location_key = Some(merchant_location_key);

    let inv = EbayInventory {
      cfg: self.cfg,
      access_token: &bearer,
    };
    // Check eBay first so callers do not create duplicate inventory/offers for the same SKU.
    let existing_inventory = inv.get_inventory_item(&sku).await?;
    let offers = inv.get_offers_by_sku(&sku).await?;

    if let Some(published) = offers
      .iter()
      .find(|o| o.get("listingId").and_then(|x| x.as_str()).is_some())
    {
      return Err(EbayListingServiceError::Conflict(json!({
        "message": "listing already published to eBay",
        "offer": published,
      })));
    }

    let image_urls: Vec<String> =
      serde_json::from_value(listing.media_urls.clone()).unwrap_or_default();
    let price = format!("{:.2}", listing.price_cents as f64 / 100.0);
    let quantity = req.quantity.unwrap_or(1).max(1);
    let offer_request = offer_request(&listing, &req, &sku, price, quantity);

    if let Some(existing) = offers
      .iter()
      .find(|o| o.get("offerId").and_then(|x| x.as_str()).is_some())
    {
      let offer_id = existing["offerId"].as_str().unwrap().to_string();
      let updated_offer = inv.update_offer(&offer_id, &offer_request).await?;
      let snapshot = json!({
        "sku": sku,
        "offerId": offer_id,
        "marketplaceId": req.marketplace_id,
        "categoryId": req.category_id,
        "reusedExistingOffer": true,
        "offer": existing,
        "updatedOffer": updated_offer,
        "request": req,
      });

      let publication_id =
        listing_publications::insert_ebay_draft(self.pool, listing.id, connection.id, snapshot)
          .await?;

      return Ok(EbayDraftResponse {
        publication_id,
        offer_id,
        sku,
        reused_existing_offer: true,
      });
    }

    inv
      .put_inventory_item(&PutInventoryItemRequest {
        sku: sku.clone(),
        title: listing.title.clone(),
        description_html: listing.description_html.clone(),
        image_urls,
        condition: req.condition_id.clone(),
        quantity,
        aspects: req.aspects.clone().unwrap_or_else(|| json!({})),
        brand: req.brand.clone(),
        mpn: req.mpn.clone(),
      })
      .await?;

    let offer_id = inv.create_offer(&offer_request).await?;

    let snapshot = json!({
      "sku": sku,
      "offerId": offer_id,
      "marketplaceId": req.marketplace_id,
      "categoryId": req.category_id,
      "inventoryExisted": existing_inventory.is_some(),
      "request": req,
    });

    let publication_id =
      listing_publications::insert_ebay_draft(self.pool, listing.id, connection.id, snapshot)
        .await?;

    Ok(EbayDraftResponse {
      publication_id,
      offer_id,
      sku: listing.sku,
      reused_existing_offer: false,
    })
  }

  /// Publish the latest pending eBay draft for a listing and mark it successful.
  pub async fn publish_draft(
    &self,
    org_id: &str,
    listing_id: Uuid,
  ) -> Result<EbayPublishResponse, EbayListingServiceError> {
    let listing = listings::get_by_id(self.pool, org_id, listing_id)
      .await?
      .ok_or(EbayListingServiceError::NotFound)?;

    channel_connections::get_ebay_secrets(self.pool, org_id)
      .await?
      .ok_or_else(|| EbayListingServiceError::BadRequest("Connect eBay first".into()))?;

    let draft = listing_publications::latest_pending_ebay_draft(self.pool, listing_id)
      .await?
      .ok_or_else(|| EbayListingServiceError::BadRequest("No pending eBay draft found".into()))?;

    let snapshot = draft.payload_snapshot.clone().unwrap_or_else(|| json!({}));
    let offer_id = snapshot
      .get("offerId")
      .and_then(|x| x.as_str())
      .filter(|x| !x.trim().is_empty())
      .ok_or_else(|| EbayListingServiceError::BadRequest("Draft missing offerId".into()))?
      .to_string();

    let bearer = EbayTokenService {
      pool: self.pool,
      cfg: self.cfg,
      crypto: self.crypto,
    }
    .bearer_for_org(org_id)
    .await?;

    let inv = EbayInventory {
      cfg: self.cfg,
      access_token: &bearer,
    };

    let offer = inv.get_offer(&offer_id).await?;
    let published = inv.publish_offer(&offer_id).await?;
    let ebay_listing_id = published
      .get("listingId")
      .and_then(|x| x.as_str())
      .map(str::to_string);

    let final_snapshot = json!({
      "sku": listing.sku,
      "offerId": offer_id,
      "listingId": ebay_listing_id,
      "offer": offer,
      "publishResponse": published,
    });

    listing_publications::mark_success(self.pool, draft.id, final_snapshot.clone()).await?;

    Ok(EbayPublishResponse {
      publication_id: draft.id,
      offer_id,
      listing_id: ebay_listing_id,
      response: final_snapshot,
    })
  }
}

fn validate_draft_policy_selection(
  setup: &Value,
  req: &EbayDraftRequest,
) -> Result<String, EbayListingServiceError> {
  let fulfillment_raw = setup
    .get("fulfillment_policies")
    .unwrap_or(&serde_json::Value::Null);
  let payment_raw = setup
    .get("payment_policies")
    .unwrap_or(&serde_json::Value::Null);
  let return_raw = setup
    .get("return_policies")
    .unwrap_or(&serde_json::Value::Null);
  let locations_raw = setup.get("locations").unwrap_or(&serde_json::Value::Null);

  validate_policy_selection(
    &req.marketplace_id,
    &policy_options(
      fulfillment_raw,
      "fulfillmentPolicies",
      "fulfillmentPolicyId",
    ),
    &policy_options(payment_raw, "paymentPolicies", "paymentPolicyId"),
    &policy_options(return_raw, "returnPolicies", "returnPolicyId"),
    &location_options(locations_raw),
    &req.fulfillment_policy_id,
    &req.payment_policy_id,
    &req.return_policy_id,
    req.merchant_location_key.as_deref(),
  )
  .map_err(policy_validation_error)
}

fn policy_validation_error(error: EbayPolicyValidationError) -> EbayListingServiceError {
  EbayListingServiceError::BadRequest(error.to_string())
}

fn offer_request(
  listing: &ConsignmentListing,
  req: &EbayDraftRequest,
  sku: &str,
  price: String,
  quantity: i64,
) -> CreateOfferRequest {
  CreateOfferRequest {
    sku: sku.to_string(),
    marketplace_id: req.marketplace_id.clone(),
    category_id: req.category_id.clone(),
    price_value: price,
    currency: listing.currency_code.clone(),
    available_quantity: quantity,
    fulfillment_policy_id: req.fulfillment_policy_id.clone(),
    payment_policy_id: req.payment_policy_id.clone(),
    return_policy_id: req.return_policy_id.clone(),
    merchant_location_key: req.merchant_location_key.clone(),
    quantity_limit_per_buyer: req.quantity_limit_per_buyer,
    include_catalog_product_details: req.include_catalog_product_details,
  }
}

#[derive(Debug, thiserror::Error)]
pub enum EbayListingServiceError {
  #[error("Listing not found")]
  NotFound,
  #[error("{0}")]
  BadRequest(String),
  #[error("conflict: {0}")]
  Conflict(Value),
  #[error(transparent)]
  Db(#[from] sqlx::Error),
  #[error(transparent)]
  Token(#[from] super::token_service::EbayTokenError),
  #[error(transparent)]
  Inventory(#[from] super::inventory::EbayInventoryError),
  #[error(transparent)]
  Account(#[from] EbayAccountError),
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  fn draft_request() -> EbayDraftRequest {
    EbayDraftRequest {
      marketplace_id: "EBAY_US".to_string(),
      category_id: "123".to_string(),
      condition_id: "NEW".to_string(),
      fulfillment_policy_id: "ship".to_string(),
      payment_policy_id: "pay".to_string(),
      return_policy_id: "ret".to_string(),
      merchant_location_key: Some("loc".to_string()),
      quantity: Some(1),
      aspects: None,
      brand: None,
      mpn: None,
      quantity_limit_per_buyer: None,
      include_catalog_product_details: None,
    }
  }

  fn setup() -> Value {
    json!({
      "fulfillment_policies": {
        "fulfillmentPolicies": [
          { "fulfillmentPolicyId": "ship", "name": "Ship", "localPickup": false }
        ]
      },
      "payment_policies": {
        "paymentPolicies": [
          { "paymentPolicyId": "pay", "name": "Pay" }
        ]
      },
      "return_policies": {
        "returnPolicies": [
          { "returnPolicyId": "ret", "name": "Return" }
        ]
      },
      "locations": {
        "locations": [
          { "merchantLocationKey": "loc", "name": "Warehouse" }
        ]
      }
    })
  }

  fn listing() -> ConsignmentListing {
    ConsignmentListing {
      id: Uuid::nil(),
      org_id: "org".to_string(),
      created_by_user_id: None,
      status: "draft".to_string(),
      title: "Title".to_string(),
      description_html: "<p>Desc</p>".to_string(),
      product_type: "".to_string(),
      vendor: "".to_string(),
      tags: Vec::new(),
      price_cents: 1000,
      currency_code: "USD".to_string(),
      sku: "sku".to_string(),
      media_urls: json!([]),
      ai_quality: None,
      ai_attributes: None,
      suggested_price_cents: None,
      created_at: chrono::Utc::now(),
      updated_at: chrono::Utc::now(),
      consignor_id: None,
      contract_id: None,
      acceptance_status: None,
      decline_reason: None,
      post_contract_disposition: None,
    }
  }

  #[test]
  fn draft_validation_accepts_live_policy_selection() {
    let location = validate_draft_policy_selection(&setup(), &draft_request()).unwrap();

    assert_eq!(location, "loc");
  }

  #[test]
  fn draft_validation_rejects_stale_policy_id() {
    let mut req = draft_request();
    req.payment_policy_id = "deleted".to_string();

    let err = validate_draft_policy_selection(&setup(), &req).unwrap_err();

    assert!(err.to_string().contains("payment policy was not found"));
  }

  #[test]
  fn reused_offer_request_uses_current_policy_selection() {
    let mut req = draft_request();
    req.fulfillment_policy_id = "new-ship".to_string();
    req.payment_policy_id = "new-pay".to_string();
    req.return_policy_id = "new-return".to_string();
    req.merchant_location_key = Some("new-location".to_string());

    let out = offer_request(&listing(), &req, "sku", "10.00".to_string(), 1);

    assert_eq!(out.fulfillment_policy_id, "new-ship");
    assert_eq!(out.payment_policy_id, "new-pay");
    assert_eq!(out.return_policy_id, "new-return");
    assert_eq!(out.merchant_location_key.as_deref(), Some("new-location"));
  }
}
