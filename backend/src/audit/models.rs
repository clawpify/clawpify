use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductData {
  pub id: String,
  pub title: String,
  pub description: Option<String>, 
  pub price: Option<String>,
  pub url: Option<String>, 
  pub meta: ProductMeta,
  pub schema: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ProductMeta {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub title: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub description: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub og_title: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub og_description: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub og_image: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoreConfig {
  pub base_url: String,
  pub platform: String,
}

