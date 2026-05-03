use reqwest::header::ACCEPT;
use reqwest::StatusCode;
use serde_json::Value;

use super::config::EbayConfig;
use super::error_utils::is_transient_ebay_error;
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
  pub supports_shipping: Option<bool>,
  pub local_pickup: Option<bool>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
pub struct EbayLocationOption {
  pub key: String,
  pub name: String,
}

fn json_scalar_string(value: &Value) -> Option<String> {
  if let Some(s) = value.as_str() {
    let trimmed = s.trim();
    return (!trimmed.is_empty()).then(|| trimmed.to_string());
  }
  if value.is_number() || value.is_boolean() {
    return Some(value.to_string());
  }
  None
}

fn json_bool(value: &Value) -> Option<bool> {
  if let Some(b) = value.as_bool() {
    return Some(b);
  }
  if value.is_object() {
    return Some(true);
  }
  None
}

fn has_non_empty_array(value: &Value, key: &str) -> bool {
  value
    .get(key)
    .and_then(|v| v.as_array())
    .is_some_and(|items| !items.is_empty())
}

fn shipping_support(value: &Value) -> (Option<bool>, Option<bool>) {
  let local_pickup = value.get("localPickup").and_then(json_bool);
  let has_shipping_options = has_non_empty_array(value, "shippingOptions");
  let supports_shipping = if has_shipping_options || local_pickup == Some(false) {
    Some(true)
  } else if local_pickup == Some(true) {
    Some(false)
  } else {
    None
  };

  (supports_shipping, local_pickup)
}

pub fn policy_options(value: &Value, array_key: &str, id_key: &str) -> Vec<EbayPolicyOption> {
  value
    .get(array_key)
    .and_then(|v| v.as_array())
    .into_iter()
    .flatten()
    .filter_map(|p| {
      let id = json_scalar_string(p.get(id_key)?)?;
      let name = p
        .get("name")
        .and_then(json_scalar_string)
        .unwrap_or_else(|| id.clone());
      let (supports_shipping, local_pickup) = shipping_support(p);
      Some(EbayPolicyOption {
        id,
        name,
        supports_shipping,
        local_pickup,
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
      let key = json_scalar_string(
        location
          .get("merchantLocationKey")
          .or_else(|| location.get("locationKey"))?,
      )?;
      let name = location
        .get("name")
        .and_then(json_scalar_string)
        .unwrap_or_else(|| key.clone());
      Some(EbayLocationOption { key, name })
    })
    .collect()
}

pub fn normalize_location_key(key: Option<&str>) -> Option<String> {
  key
    .map(str::trim)
    .filter(|value| !value.is_empty())
    .map(str::to_string)
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum EbayPolicyValidationError {
  #[error("marketplace_id is required")]
  MissingMarketplace,
  #[error("fulfillment_policy_id is required")]
  MissingFulfillmentPolicy,
  #[error("payment_policy_id is required")]
  MissingPaymentPolicy,
  #[error("return_policy_id is required")]
  MissingReturnPolicy,
  #[error("merchant_location_key is required for eBay publish-ready offers")]
  MissingMerchantLocationKey,
  #[error("Selected eBay shipping policy was not found")]
  UnknownFulfillmentPolicy,
  #[error("Selected eBay payment policy was not found")]
  UnknownPaymentPolicy,
  #[error("Selected eBay return policy was not found")]
  UnknownReturnPolicy,
  #[error("Selected eBay inventory location was not found")]
  UnknownMerchantLocationKey,
  #[error("Selected eBay fulfillment policy does not support shipping")]
  FulfillmentPolicyNotShipping,
}

fn find_policy<'a>(policies: &'a [EbayPolicyOption], id: &str) -> Option<&'a EbayPolicyOption> {
  policies.iter().find(|policy| policy.id == id)
}

pub fn validate_policy_selection(
  marketplace_id: &str,
  fulfillment_policies: &[EbayPolicyOption],
  payment_policies: &[EbayPolicyOption],
  return_policies: &[EbayPolicyOption],
  locations: &[EbayLocationOption],
  fulfillment_policy_id: &str,
  payment_policy_id: &str,
  return_policy_id: &str,
  merchant_location_key: Option<&str>,
) -> Result<String, EbayPolicyValidationError> {
  if marketplace_id.trim().is_empty() {
    return Err(EbayPolicyValidationError::MissingMarketplace);
  }
  if fulfillment_policy_id.trim().is_empty() {
    return Err(EbayPolicyValidationError::MissingFulfillmentPolicy);
  }
  if payment_policy_id.trim().is_empty() {
    return Err(EbayPolicyValidationError::MissingPaymentPolicy);
  }
  if return_policy_id.trim().is_empty() {
    return Err(EbayPolicyValidationError::MissingReturnPolicy);
  }

  let merchant_location_key = normalize_location_key(merchant_location_key)
    .ok_or(EbayPolicyValidationError::MissingMerchantLocationKey)?;

  let fulfillment = find_policy(fulfillment_policies, fulfillment_policy_id)
    .ok_or(EbayPolicyValidationError::UnknownFulfillmentPolicy)?;
  if fulfillment.supports_shipping == Some(false) {
    return Err(EbayPolicyValidationError::FulfillmentPolicyNotShipping);
  }
  if find_policy(payment_policies, payment_policy_id).is_none() {
    return Err(EbayPolicyValidationError::UnknownPaymentPolicy);
  }
  if find_policy(return_policies, return_policy_id).is_none() {
    return Err(EbayPolicyValidationError::UnknownReturnPolicy);
  }
  if !locations
    .iter()
    .any(|location| location.key == merchant_location_key)
  {
    return Err(EbayPolicyValidationError::UnknownMerchantLocationKey);
  }

  Ok(merchant_location_key)
}

pub struct EbayAccount<'a> {
  pub cfg: &'a EbayConfig,
  pub access_token: &'a str,
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  fn policy(id: &str, supports_shipping: Option<bool>) -> EbayPolicyOption {
    EbayPolicyOption {
      id: id.to_string(),
      name: id.to_string(),
      supports_shipping,
      local_pickup: None,
    }
  }

  fn location(key: &str) -> EbayLocationOption {
    EbayLocationOption {
      key: key.to_string(),
      name: key.to_string(),
    }
  }

  #[test]
  fn policy_options_marks_local_pickup_only_policy() {
    let out = policy_options(
      &json!({
        "fulfillmentPolicies": [
          { "fulfillmentPolicyId": "pickup", "name": "Pickup", "localPickup": true },
          { "fulfillmentPolicyId": "ship", "name": "Ship", "localPickup": false }
        ]
      }),
      "fulfillmentPolicies",
      "fulfillmentPolicyId",
    );

    assert_eq!(out[0].supports_shipping, Some(false));
    assert_eq!(out[0].local_pickup, Some(true));
    assert_eq!(out[1].supports_shipping, Some(true));
  }

  #[test]
  fn validate_policy_selection_requires_location() {
    let err = validate_policy_selection(
      "EBAY_US",
      &[policy("f1", Some(true))],
      &[policy("p1", None)],
      &[policy("r1", None)],
      &[location("loc1")],
      "f1",
      "p1",
      "r1",
      None,
    )
    .unwrap_err();

    assert_eq!(err, EbayPolicyValidationError::MissingMerchantLocationKey);
  }

  #[test]
  fn validate_policy_selection_rejects_local_pickup_only_policy() {
    let err = validate_policy_selection(
      "EBAY_US",
      &[policy("f1", Some(false))],
      &[policy("p1", None)],
      &[policy("r1", None)],
      &[location("loc1")],
      "f1",
      "p1",
      "r1",
      Some("loc1"),
    )
    .unwrap_err();

    assert_eq!(err, EbayPolicyValidationError::FulfillmentPolicyNotShipping);
  }

  #[test]
  fn validate_policy_selection_returns_trimmed_location() {
    let location = validate_policy_selection(
      "EBAY_US",
      &[policy("f1", Some(true))],
      &[policy("p1", None)],
      &[policy("r1", None)],
      &[location("loc1")],
      "f1",
      "p1",
      "r1",
      Some(" loc1 "),
    )
    .unwrap();

    assert_eq!(location, "loc1");
  }
}

impl<'a> EbayAccount<'a> {
  /// Get the base URL for the eBay API.
  fn base(&self) -> String {
    self.cfg.api_base_url().trim_end_matches('/').to_string()
  }

  /// Send an authenticated GET request and preserve eBay error bodies.
  async fn get_json(&self, url: String) -> Result<Value, EbayAccountError> {
    let mut attempt = 0;
    loop {
      let res = http_client::shared()
        .get(&url)
        .bearer_auth(self.access_token)
        .header(ACCEPT, "application/json")
        .send()
        .await?;

      let status = res.status();
      let body = res.text().await?;

      if !status.is_success() {
        if attempt < 2 && is_transient_ebay_error(status, &body) {
          attempt += 1;
          tokio::time::sleep(std::time::Duration::from_millis(250 * attempt)).await;
          continue;
        }
        return Err(EbayAccountError::Api { status, body });
      }

      return Ok(serde_json::from_str(&body)?);
    }
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
