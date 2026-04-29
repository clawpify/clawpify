use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow, ToSchema)]
pub struct ConsignmentListing {
  pub id: Uuid,                                  // id
  pub org_id: String,                            // org id
  pub created_by_user_id: Option<String>,        // created by user id
  pub status: String,                            // status
  pub title: String,                             // title
  pub description_html: String,                  // description html
  pub product_type: String,                      // product type
  pub vendor: String,                            // vendor
  pub tags: Vec<String>,                         // tags
  pub price_cents: i64,                          // price cents
  pub currency_code: String,                     // currency code
  pub sku: String,                               // sku
  pub media_urls: serde_json::Value,             // media urls
  pub ai_quality: Option<serde_json::Value>,     // ai quality
  pub ai_attributes: Option<serde_json::Value>,  // ai attributes
  pub suggested_price_cents: Option<i64>,        // suggested price cents
  pub created_at: chrono::DateTime<chrono::Utc>, // created at
  pub updated_at: chrono::DateTime<chrono::Utc>, // updated at
  pub consignor_id: Option<Uuid>,                // consignor id
  pub contract_id: Option<Uuid>,                 // contract id
  pub acceptance_status: Option<String>,         // acceptance status
  pub decline_reason: Option<String>,            // decline reason
  pub post_contract_disposition: Option<String>, // post contract disposition
}
