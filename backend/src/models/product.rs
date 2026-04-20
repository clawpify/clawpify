use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductData {
  pub id: String,                               // id
  pub title: String,                            // title  
  pub description: Option<String>,              // description
  pub price: Option<String>,                    // price
  pub url: Option<String>,                      // url
  pub meta: ProductMeta,                        // meta
  pub schema: Option<serde_json::Value>,        // schema
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ProductMeta {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub title: Option<String>,                    // title
  #[serde(skip_serializing_if = "Option::is_none")]
  pub description: Option<String>,              // description
  #[serde(skip_serializing_if = "Option::is_none")]
  pub og_title: Option<String>,                  // og title
  #[serde(skip_serializing_if = "Option::is_none")]
  pub og_description: Option<String>,            // og description
  #[serde(skip_serializing_if = "Option::is_none")]
  pub og_image: Option<String>,                  // og image
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoreConfig {
  pub base_url: String,                          // base url
  pub platform: String,                          // platform
}
