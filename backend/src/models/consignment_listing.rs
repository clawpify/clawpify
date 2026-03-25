use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow)]
pub struct ConsignmentListing {
  /* id: The ID of the consignment listing. */
  pub id: Uuid,
  /* org_id: The ID of the organization. */
  pub org_id: String,
  /* created_by_user_id: The ID of the user who created the listing. */
  pub created_by_user_id: Option<String>,
  /* status: The status of the listing. */
  pub status: String,
  /* title: The title of the listing. */
  pub title: String,
  /* description_html: The HTML description of the listing. */
  pub description_html: String,
  /* product_type: The type of product the listing is for. */
  pub product_type: String,
  /* vendor: The vendor of the listing. */
  pub vendor: String,
  /* tags: The tags of the listing. */
  pub tags: Vec<String>,
  /* price_cents: The price of the listing in cents. */
  pub price_cents: i64,
  /* currency_code: The currency code of the listing. */
  pub currency_code: String,
  /* sku: The SKU of the listing. */
  pub sku: String,
  /* media_urls: The media URLs of the listing. */
  pub media_urls: serde_json::Value,
  /* ai_quality: The AI quality of the listing. */
  pub ai_quality: Option<serde_json::Value>,
  /* ai_attributes: The AI attributes of the listing. */
  pub ai_attributes: Option<serde_json::Value>,
  /* suggested_price_cents: The suggested price of the listing in cents. */
  pub suggested_price_cents: Option<i64>,
  /* created_at: The date and time the listing was created. */
  pub created_at: chrono::DateTime<chrono::Utc>,
  /* updated_at: The date and time the listing was last updated. */
  pub updated_at: chrono::DateTime<chrono::Utc>,
}
