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
  #[error("No eBay fulfillment policy matches localPickup: {local_pickup}. Create or edit a fulfillment policy in eBay with localPickup: {local_pickup} before creating drafts.")]
  NoMatchingFulfillmentPolicy { local_pickup: bool },
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
pub struct EbayPolicyOption {
  pub id: String,
  pub name: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
pub struct EbayLocationOption {
  pub key: String,
  pub name: String,
}

pub fn policy_options(value: &Value, array_key: &str, id_key: &str) -> Vec<EbayPolicyOption> {
  value
    .get(array_key)
    .and_then(|v| v.as_array())
    .into_iter()
    .flatten()
    .filter_map(|p| {
      let id = p.get(id_key)?.as_str()?.trim();
      let name = p.get("name").and_then(|v| v.as_str()).unwrap_or(id).trim();
      Some(EbayPolicyOption {
        id: id.to_string(),
        name: name.to_string(),
      })
    })
    .collect()
}

pub fn location_options(value: &Value) -> Vec<EbayLocationOption> {
  value
    .get("locations")
    .and_then(|v| v.as_array())
    .into_iter()
    .flatten()
    .filter_map(|location| {
      let key = location
        .get("merchantLocationKey")
        .or_else(|| location.get("locationKey"))?
        .as_str()?
        .trim();
      let name = location
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or(key)
        .trim();
      Some(EbayLocationOption {
        key: key.to_string(),
        name: name.to_string(),
      })
    })
    .collect()
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
  pub async fn seller_setup(
    &self,
    marketplace_id: &str,
    local_pickup: bool,
  ) -> Result<Value, EbayAccountError> {
    let m = urlencoding::encode(marketplace_id);
    let fulfillment = self
      .get_json(format!(
        "{}/sell/account/v1/fulfillment_policy?marketplace_id={}",
        self.base(),
        m
      ))
      .await?;
    // Use the seller's available fulfillment policies as returned by eBay. eBay's `localPickup`
    // metadata varies by policy type and seller setup; hard-filtering here can block sellers who
    // already have a valid policy that eBay will accept for offer creation.
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
      "local_pickup": local_pickup,
      "fulfillment_policies": fulfillment,
      "payment_policies": payment,
      "return_policies": returns,
      "locations": locations,
    }))
  }
}
