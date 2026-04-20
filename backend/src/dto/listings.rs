use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

/// Shared optional fields for create and update listing APIs.
#[derive(Debug, Deserialize, ToSchema)]
pub struct ListingRequestBody {
  pub title: Option<String>,                          // title  
  pub description_html: Option<String>,              // description html
  pub product_type: Option<String>,                  // product type
  pub vendor: Option<String>,                        // vendor
  pub tags: Option<Vec<String>>,                     // tags
  pub price_cents: Option<i64>,                      // price cents
  pub suggested_price_cents: Option<i64>,            // suggested price cents
  pub currency_code: Option<String>,                 // currency code
  pub sku: Option<String>,                           // sku
  pub media_urls: Option<serde_json::Value>,         // media urls
  pub status: Option<String>,                        // status
  pub ai_quality: Option<serde_json::Value>,         // ai quality
  pub ai_attributes: Option<serde_json::Value>,      // ai attributes
  pub consignor_id: Option<Uuid>,                    // consignor id
  pub contract_id: Option<Uuid>,                     // contract id
  pub acceptance_status: Option<String>,             // acceptance status
  pub decline_reason: Option<String>,                // decline reason
  pub post_contract_disposition: Option<String>,     // post contract disposition
}

pub type CreateListingRequest = ListingRequestBody;
pub type UpdateListingRequest = ListingRequestBody;
