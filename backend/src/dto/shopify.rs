use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct ShopifyOauthStartRequest {
  pub shop: String,
}

#[derive(Serialize)]
pub struct ShopifyOauthStartResponse {
  pub authorize_url: String,
}
