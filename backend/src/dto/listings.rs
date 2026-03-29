use serde::Deserialize;
use uuid::Uuid;

/// Shared optional fields for create and update listing APIs.
#[derive(Debug, Deserialize)]
pub struct ListingRequestBody {
  /* title: The title of the listing. */
  pub title: Option<String>,
  /* description_html: The HTML description of the listing. */
  pub description_html: Option<String>,
  /* product_type: The type of product the listing is for. */
  pub product_type: Option<String>,
  /* vendor: The vendor of the listing. */
  pub vendor: Option<String>,
  /* tags: The tags of the listing. */
  pub tags: Option<Vec<String>>,
  /* price_cents: The price of the listing in cents. */
  pub price_cents: Option<i64>,
  /* suggested_price_cents: The suggested price of the listing in cents. */
  pub suggested_price_cents: Option<i64>,
  /* currency_code: The currency code of the listing. */
  pub currency_code: Option<String>,
  /* sku: The SKU of the listing. */
  pub sku: Option<String>,
  /* media_urls: The media URLs of the listing. */
  pub media_urls: Option<serde_json::Value>,
  /* status: The status of the listing. */
  pub status: Option<String>,
  /* ai_quality: The AI quality of the listing. */
  pub ai_quality: Option<serde_json::Value>,
  /* ai_attributes: The AI attributes of the listing. */
  pub ai_attributes: Option<serde_json::Value>,
  pub consignor_id: Option<Uuid>,
  pub contract_id: Option<Uuid>,
  pub acceptance_status: Option<String>,
  pub decline_reason: Option<String>,
  pub post_contract_disposition: Option<String>,
}

pub type CreateListingRequest = ListingRequestBody;
pub type UpdateListingRequest = ListingRequestBody;
