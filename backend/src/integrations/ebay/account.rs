use reqwest::StatusCode;
use serde_json::Value;

use super::config::EbayConfig;
use crate::http_client;

#[derive(Debug, thiserror::Error)]
pub enum EbayAccountError {
  #[error(transparent)]
  Http(#[from] reqwest::Error),
  #[error(transparent)]
  Json(#[from] serde_json::Error),
  #[error("ebay api {status}: {body}")]
  Api { status: StatusCode, body: String },
}

pub struct EbayAccount<'a> {
  pub cfg: &'a EbayConfig,
  pub access_token: &'a str,
}

impl<'a> EbayAccount<'a> {
  /// Get the base URL for the eBay API.
  fn base(&self) -> String {
    self.cfg.api_base_url().trim_end_matches('/').to_string()
  }

  /// Send an authenticated GET request and preserve eBay error bodies.
  async fn get_json(&self, url: String) -> Result<Value, EbayAccountError> {
    let res = http_client::shared()
      .get(url)
      .header("Authorization", format!("Bearer {}", self.access_token))
      .send()
      .await?;

    let status = res.status();
    let body = res.text().await?;

    if !status.is_success() {
      return Err(EbayAccountError::Api { status, body });
    }

    Ok(serde_json::from_str(&body)?)
  }

  /// Fetch seller policies and inventory locations needed to create offers.
  pub async fn seller_setup(&self, marketplace_id: &str) -> Result<Value, EbayAccountError> {
    let m = urlencoding::encode(marketplace_id);
    let fulfillment = self
      .get_json(format!(
        "{}/sell/account/v1/fulfillment_policy?marketplace_id={}",
        self.base(),
        m
      ))
      .await?;
    let payment = self
      .get_json(format!(
        "{}/sell/account/v1/payment_policy?marketplace_id={}",
        self.base(),
        m
      ))
      .await?;
    let returns = self
      .get_json(format!(
        "{}/sell/account/v1/return_policy?marketplace_id={}",
        self.base(),
        m
      ))
      .await?;
    let locations = self
      .get_json(format!("{}/sell/inventory/v1/location", self.base()))
      .await?;

    Ok(serde_json::json!({
      "marketplace_id": marketplace_id,
      "fulfillment_policies": fulfillment,
      "payment_policies": payment,
      "return_policies": returns,
      "locations": locations,
    }))
  }
}
