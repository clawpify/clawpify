use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(FromRow)]
pub struct CitationRow {
  pub id: Uuid,
  pub company_name: String,
  pub website_url: String,
  pub product_description: String,
  pub status: String,
  pub created_at: chrono::DateTime<chrono::Utc>,
  pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Serialize, FromRow)]
pub struct CitationResultRow {
  pub id: Uuid,
  pub citation_id: Uuid,
  pub query: String,
  pub response_text: Option<String>,
  pub citation_urls: Option<serde_json::Value>,
  pub mentioned_brands: Option<serde_json::Value>,
  pub your_product_mentioned: Option<bool>,
  pub provider: Option<String>,
  pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(FromRow)]
pub struct CitationSummaryRow {
  pub id: Uuid,
  pub company_name: String,
  pub website_url: String,
  pub status: String,
  pub created_at: chrono::DateTime<chrono::Utc>,
  pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}
