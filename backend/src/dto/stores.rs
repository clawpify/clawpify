use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateStoreRequest {
  pub base_url: String,
  #[serde(default)]
  pub platform: String,
}
