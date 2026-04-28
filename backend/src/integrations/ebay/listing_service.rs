use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use super::config::EbayConfig;
use super::inventory::{CreateOfferRequest, EbayInventory, PutInventoryItemRequest};
use super::token_service::EbayTokenService;
use crate::crypto::tokens::TokenCrypto;
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
    req: EbayDraftRequest,
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

    if let Some(existing) = offers
      .iter()
      .find(|o| o.get("offerId").and_then(|x| x.as_str()).is_some())
    {
      let offer_id = existing["offerId"].as_str().unwrap().to_string();
      let snapshot = json!({
        "sku": sku,
        "offerId": offer_id,
        "marketplaceId": req.marketplace_id,
        "categoryId": req.category_id,
        "reusedExistingOffer": true,
        "offer": existing,
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

    let image_urls: Vec<String> =
      serde_json::from_value(listing.media_urls.clone()).unwrap_or_default();
    let price = format!("{:.2}", listing.price_cents as f64 / 100.0);
    let quantity = req.quantity.unwrap_or(1).max(1);

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

    let offer_id = inv
      .create_offer(&CreateOfferRequest {
        sku: sku.clone(),
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
      })
      .await?;

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
}
