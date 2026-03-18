use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateStoreRequest {
  /* base URL of the store */
  pub base_url: String,
  #[serde(default)]
  /* platform of the store */
  pub platform: String,
}
