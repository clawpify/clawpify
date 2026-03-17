use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct GenerateRequest {
  pub company_name: String,
  pub website_url: String,
  #[serde(default)]
  pub website_content: Option<String>,
}

#[derive(Serialize)]
pub struct GenerateResponse {
  pub prompts: Vec<String>,
  pub competitors: Vec<String>,
}

#[derive(Deserialize)]
pub struct CreateCitationRequest {
  pub company_name: String,
  pub website_url: String,
  #[serde(default)]
  pub product_description: String,
  #[serde(default)]
  pub custom_prompts: Option<Vec<String>>,
  #[serde(default)]
  pub run_search: Option<bool>,
}

#[derive(Serialize)]
pub struct CreateCitationResponse {
  pub id: Uuid,
}

#[derive(Serialize)]
pub struct VisibilityByProvider {
  pub total: u32,
  pub mentioned: u32,
  pub visibility_pct: u32,
}

#[derive(Serialize)]
pub struct CitationWithVisibility {
  pub id: Uuid,
  pub company_name: String,
  pub website_url: String,
  pub status: String,
  pub created_at: chrono::DateTime<chrono::Utc>,
  pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
  pub visibility_by_provider: HashMap<String, VisibilityByProvider>,
}

#[derive(Serialize)]
pub struct ListCitationsResponse {
  pub citations: Vec<CitationWithVisibility>,
}
