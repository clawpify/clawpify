use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductData {
  /* id: The ID of the product. */
  pub id: String,
  /* title: The title of the product. */
  pub title: String,
  /* description: The description of the product. */
  pub description: Option<String>,
  /* price: The price of the product. */
  pub price: Option<String>,
  /* url: The URL of the product. */
  pub url: Option<String>,
  /* meta: The meta data of the product. */
  pub meta: ProductMeta,
  /* schema: The schema of the product. */
  pub schema: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ProductMeta {
  /* title: The title of the product meta. */
  #[serde(skip_serializing_if = "Option::is_none")]
  pub title: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  /* description: The description of the product meta. */
  pub description: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  /* og_title: The og title of the product meta. */
  pub og_title: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  /* og_description: The og description of the product meta. */
  pub og_description: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  /* og_image: The og image of the product meta. */
  pub og_image: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoreConfig {
  /* base_url: The base URL of the store. */
  pub base_url: String,
  /* platform: The platform of the store. */
  pub platform: String,
}
