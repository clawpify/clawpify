use reqwest::header::{ACCEPT, CONTENT_TYPE};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use super::config::EbayConfig;
use super::error_utils::is_transient_ebay_error;
use crate::http_client;

#[derive(Debug, thiserror::Error)]
pub enum EbayInventoryError {
  #[error(transparent)]
  Http(#[from] reqwest::Error),
  #[error(transparent)]
  Json(#[from] serde_json::Error),
  #[error("ebay api {status}: {body}")]
  Api { status: StatusCode, body: String },
  #[error("ebay response missing {0}")]
  MissingField(&'static str),
  #[error("ebay request could not be retried")]
  RequestClone,
}

pub struct EbayInventory<'a> {
  pub cfg: &'a EbayConfig,   // eBay API configuration
  pub access_token: &'a str, // eBay API access token
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PutInventoryItemRequest {
  pub sku: String,
  pub title: String,
  pub description_html: String,
  pub image_urls: Vec<String>,
  pub condition: String,
  pub quantity: i64,
  #[serde(default)]
  pub aspects: Value,
  pub brand: Option<String>,
  pub mpn: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOfferRequest {
  pub sku: String,
  pub marketplace_id: String,
  pub category_id: String,
  pub price_value: String,
  pub currency: String,
  pub available_quantity: i64,
  pub fulfillment_policy_id: String,
  pub payment_policy_id: String,
  pub return_policy_id: String,
  pub merchant_location_key: Option<String>,
  pub quantity_limit_per_buyer: Option<i64>,
  pub include_catalog_product_details: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateInventoryLocationRequest {
  pub merchant_location_key: String,
  pub name: String,
  pub address_line1: Option<String>,
  pub city: Option<String>,
  pub state_or_province: Option<String>,
  pub postal_code: Option<String>,
  pub country: String,
}

impl<'a> EbayInventory<'a> {
  /**
   * Get the base URL for the eBay API.
   * - return The base URL as a string.
   */
  fn base(&self) -> String {
    self.cfg.api_base_url().trim_end_matches('/').to_string()
  }

  /// Send an authenticated JSON request and preserve eBay error bodies.
  async fn send_json<T: serde::de::DeserializeOwned>(
    &self,
    req: reqwest::RequestBuilder,
  ) -> Result<T, EbayInventoryError> {
    let req = req
      .bearer_auth(self.access_token)
      .header(ACCEPT, "application/json")
      .header(CONTENT_TYPE, "application/json");
    let Some(template) = req.try_clone() else {
      return self.send_json_once(req).await;
    };

    let mut attempt = 0;
    loop {
      let res = template
        .try_clone()
        .ok_or(EbayInventoryError::RequestClone)?
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
        return Err(EbayInventoryError::Api { status, body });
      }

      return parse_json_body(&body);
    }
  }

  async fn send_json_once<T: serde::de::DeserializeOwned>(
    &self,
    req: reqwest::RequestBuilder,
  ) -> Result<T, EbayInventoryError> {
    let res = req.send().await?;
    let status = res.status();
    let body = res.text().await?;

    if !status.is_success() {
      return Err(EbayInventoryError::Api { status, body });
    }

    parse_json_body(&body)
  }

  /**
   * Get inventory item by SKU; returns `None` when eBay reports 404.
   * - param sku - The SKU to get the inventory item for.
   * - return The inventory item as a JSON object.
   * - throws EbayInventoryError if the request fails.
   */
  pub async fn get_inventory_item(&self, sku: &str) -> Result<Option<Value>, EbayInventoryError> {
    let url = format!(
      "{}/sell/inventory/v1/inventory_item/{}",
      self.base(),
      urlencoding::encode(sku),
    );

    let mut attempt = 0;
    loop {
      let res = http_client::shared()
        .get(&url)
        .bearer_auth(self.access_token)
        .header(ACCEPT, "application/json")
        .send()
        .await?;

      if res.status() == StatusCode::NOT_FOUND {
        return Ok(None);
      }

      let status = res.status();
      let body = res.text().await?;

      if !status.is_success() {
        if attempt < 2 && is_transient_ebay_error(status, &body) {
          attempt += 1;
          tokio::time::sleep(std::time::Duration::from_millis(250 * attempt)).await;
          continue;
        }
        return Err(EbayInventoryError::Api { status, body });
      }

      return Ok(Some(serde_json::from_str(&body)?));
    }
  }

  /// Get all offers associated with a SKU, including unpublished offers.
  pub async fn get_offers_by_sku(&self, sku: &str) -> Result<Vec<Value>, EbayInventoryError> {
    let url = format!(
      "{}/sell/inventory/v1/offer?sku={}",
      self.base(),
      urlencoding::encode(sku),
    );
    let v: Value = self.send_json(http_client::shared().get(url)).await?;
    Ok(
      v.get("offers")
        .and_then(|x| x.as_array())
        .cloned()
        .unwrap_or_default(),
    )
  }

  /// Get one offer by eBay offer id.
  pub async fn get_offer(&self, offer_id: &str) -> Result<Value, EbayInventoryError> {
    let url = format!(
      "{}/sell/inventory/v1/offer/{}",
      self.base(),
      urlencoding::encode(offer_id),
    );
    self.send_json(http_client::shared().get(url)).await
  }

  /// Create or update the eBay inventory item backing an offer.
  pub async fn put_inventory_item(
    &self,
    input: &PutInventoryItemRequest,
  ) -> Result<(), EbayInventoryError> {
    let url = format!(
      "{}/sell/inventory/v1/inventory_item/{}",
      self.base(),
      urlencoding::encode(&input.sku),
    );

    let mut product = json!({
      "title": input.title,
      "description": input.description_html,
      "imageUrls": input.image_urls,
      "aspects": input.aspects,
    });

    if let Some(brand) = &input.brand {
      product["brand"] = json!(brand);
    }

    if let Some(mpn) = &input.mpn {
      product["mpn"] = json!(mpn);
    }

    let body = json!({
      "availability": { "shipToLocationAvailability": { "quantity": input.quantity } },
      "condition": input.condition,
      "product": product,
    });

    let _: Value = self
      .send_json(
        http_client::shared()
          .put(url)
          .header("Content-Language", "en-US")
          .json(&body),
      )
      .await?;

    Ok(())
  }

  /// Create a seller ship-from location. eBay requires a seller-defined
  /// merchantLocationKey plus a physical location for Inventory API offers.
  pub async fn create_inventory_location(
    &self,
    input: &CreateInventoryLocationRequest,
  ) -> Result<(), EbayInventoryError> {
    let url = format!(
      "{}/sell/inventory/v1/location/{}",
      self.base(),
      urlencoding::encode(&input.merchant_location_key),
    );
    let body = create_inventory_location_body(input);

    let _: Value = self
      .send_json(
        http_client::shared()
          .post(url)
          .header("Content-Language", "en-US")
          .json(&body),
      )
      .await?;

    Ok(())
  }

  /// Create an unpublished offer; this is the eBay draft.
  pub async fn create_offer(
    &self,
    input: &CreateOfferRequest,
  ) -> Result<String, EbayInventoryError> {
    let url = format!("{}/sell/inventory/v1/offer", self.base());
    let body = offer_body(input, true);

    let v: Value = self
      .send_json(http_client::shared().post(url).json(&body))
      .await?;
    let offer_id = v
      .get("offerId")
      .and_then(|x| x.as_str())
      .unwrap_or_default()
      .trim();

    if offer_id.is_empty() {
      return Err(EbayInventoryError::MissingField("offerId"));
    }

    Ok(offer_id.to_string())
  }

  /// Update an unpublished offer before publish, keeping reused drafts aligned with current policy choices.
  pub async fn update_offer(
    &self,
    offer_id: &str,
    input: &CreateOfferRequest,
  ) -> Result<Value, EbayInventoryError> {
    let url = format!(
      "{}/sell/inventory/v1/offer/{}",
      self.base(),
      urlencoding::encode(offer_id),
    );
    let body = offer_body(input, false);

    self
      .send_json(http_client::shared().put(url).json(&body))
      .await
  }

  /// Publish an existing unpublished offer.
  pub async fn publish_offer(&self, offer_id: &str) -> Result<Value, EbayInventoryError> {
    let url = format!(
      "{}/sell/inventory/v1/offer/{}/publish",
      self.base(),
      urlencoding::encode(offer_id),
    );
    self.send_json(http_client::shared().post(url)).await
  }
}

fn parse_json_body<T: serde::de::DeserializeOwned>(body: &str) -> Result<T, EbayInventoryError> {
  if body.trim().is_empty() {
    return Ok(serde_json::from_value(Value::Null)?);
  }

  Ok(serde_json::from_str(body)?)
}

fn offer_body(input: &CreateOfferRequest, include_sku: bool) -> Value {
  let mut body = json!({
    "marketplaceId": input.marketplace_id,
    "format": "FIXED_PRICE",
    "categoryId": input.category_id,
    "availableQuantity": input.available_quantity,
    "listingPolicies": {
      "fulfillmentPolicyId": input.fulfillment_policy_id,
      "paymentPolicyId": input.payment_policy_id,
      "returnPolicyId": input.return_policy_id,
    },
    "pricingSummary": {
      "price": {
        "value": input.price_value,
        "currency": input.currency,
      }
    }
  });

  if include_sku {
    body["sku"] = json!(input.sku);
  }

  if let Some(key) = &input.merchant_location_key {
    body["merchantLocationKey"] = json!(key);
  }

  if let Some(limit) = input.quantity_limit_per_buyer {
    body["quantityLimitPerBuyer"] = json!(limit);
  }

  if let Some(include) = input.include_catalog_product_details {
    body["includeCatalogProductDetails"] = json!(include);
  }

  body
}

fn create_inventory_location_body(input: &CreateInventoryLocationRequest) -> Value {
  let mut address = json!({
    "country": input.country,
  });
  if let Some(value) = &input.address_line1 {
    address["addressLine1"] = json!(value);
  }
  if let Some(value) = &input.city {
    address["city"] = json!(value);
  }
  if let Some(value) = &input.state_or_province {
    address["stateOrProvince"] = json!(value);
  }
  if let Some(value) = &input.postal_code {
    address["postalCode"] = json!(value);
  }

  json!({
    "name": input.name,
    "merchantLocationStatus": "ENABLED",
    "locationTypes": ["WAREHOUSE"],
    "location": {
      "address": address
    }
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  fn request() -> CreateOfferRequest {
    CreateOfferRequest {
      sku: "sku-1".to_string(),
      marketplace_id: "EBAY_US".to_string(),
      category_id: "123".to_string(),
      price_value: "10.00".to_string(),
      currency: "USD".to_string(),
      available_quantity: 1,
      fulfillment_policy_id: "fulfillment".to_string(),
      payment_policy_id: "payment".to_string(),
      return_policy_id: "return".to_string(),
      merchant_location_key: Some("warehouse".to_string()),
      quantity_limit_per_buyer: Some(1),
      include_catalog_product_details: Some(true),
    }
  }

  fn location_request() -> CreateInventoryLocationRequest {
    CreateInventoryLocationRequest {
      merchant_location_key: "clawpify-store-ship-from".to_string(),
      name: "Store ship-from".to_string(),
      address_line1: None,
      city: None,
      state_or_province: None,
      postal_code: Some("V8W 1B3".to_string()),
      country: "CA".to_string(),
    }
  }

  #[test]
  fn offer_body_includes_publish_required_policies_and_location() {
    let body = offer_body(&request(), true);

    assert_eq!(body["sku"], "sku-1");
    assert_eq!(
      body["listingPolicies"]["fulfillmentPolicyId"],
      "fulfillment"
    );
    assert_eq!(body["listingPolicies"]["paymentPolicyId"], "payment");
    assert_eq!(body["listingPolicies"]["returnPolicyId"], "return");
    assert_eq!(body["merchantLocationKey"], "warehouse");
  }

  #[test]
  fn update_offer_body_omits_create_only_sku() {
    let body = offer_body(&request(), false);

    assert!(body.get("sku").is_none());
    assert_eq!(body["marketplaceId"], "EBAY_US");
  }

  #[test]
  fn create_location_body_uses_warehouse_and_postal_address() {
    let body = create_inventory_location_body(&location_request());

    assert_eq!(body["name"], "Store ship-from");
    assert_eq!(body["merchantLocationStatus"], "ENABLED");
    assert_eq!(body["locationTypes"][0], "WAREHOUSE");
    assert_eq!(body["location"]["address"]["country"], "CA");
    assert_eq!(body["location"]["address"]["postalCode"], "V8W 1B3");
    assert!(body["location"]["address"].get("city").is_none());
  }
}
