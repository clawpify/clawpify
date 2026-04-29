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

pub struct EbayAccount<'a> {
  pub cfg: &'a EbayConfig,
  pub access_token: &'a str,
}

const FULFILLMENT_POLICY_KEYS: [&str; 2] = ["fulfillmentPolicies", "fulfillment_policies"];

fn policy_local_pickup(policy: &Value) -> bool {
  policy
    .get("localPickup")
    .and_then(Value::as_bool)
    .or_else(|| policy.get("pickupDropOff").and_then(Value::as_bool))
    .unwrap_or(false)
}

fn matching_fulfillment_policies(
  policies: &[Value],
  local_pickup: bool,
) -> Result<Vec<Value>, EbayAccountError> {
  let matches: Vec<Value> = policies
    .iter()
    .filter(|policy| policy_local_pickup(policy) == local_pickup)
    .cloned()
    .collect();

  if matches.is_empty() {
    return Err(EbayAccountError::NoMatchingFulfillmentPolicy { local_pickup });
  }

  Ok(matches)
}

fn filter_fulfillment_policies(
  mut fulfillment: Value,
  local_pickup: bool,
) -> Result<Value, EbayAccountError> {
  if let Some(policies) = fulfillment.as_array() {
    return Ok(Value::Array(matching_fulfillment_policies(
      policies,
      local_pickup,
    )?));
  }

  for policy_key in FULFILLMENT_POLICY_KEYS {
    let Some(policies) = fulfillment.get(policy_key).and_then(Value::as_array) else {
      continue;
    };

    let matches = matching_fulfillment_policies(policies, local_pickup)?;
    let total = matches.len();

    if let Some(obj) = fulfillment.as_object_mut() {
      obj.insert(policy_key.to_string(), Value::Array(matches));
      obj.insert("total".to_string(), Value::from(total));
    }

    return Ok(fulfillment);
  }

  Ok(fulfillment)
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
    let fulfillment = filter_fulfillment_policies(fulfillment, local_pickup)?;
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
