use reqwest::StatusCode;
use serde_json::json;

use super::config::EbayConfig;
use crate::http_client;

#[derive(Debug, thiserror::Error)]
pub enum EbayInventoryError {
  #[error(transparent)]
  Http(#[from] reqwest::Error),
  #[error(transparent)]
  Json(#[from] serde_json::Error),
  #[error("ebay api {status}: {body}")]
  Api { status: StatusCode, body: String },
}

pub struct EbayInventory<'a> {
  pub cfg: &'a EbayConfig,
  pub access_token: &'a str,
}

impl<'a> EbayInventory<'a> {
  fn base(&self) -> String {
    self.cfg.api_base_url().trim_end_matches('/').to_string()
  }

  pub async fn put_inventory_item(
    &self,
    sku: &str,
    title: &str,
    description_html: &str,
    image_urls: Vec<String>,
    _category_id: &str,
    condition_id: &str,
  ) -> Result<(), EbayInventoryError> {

    let url = format!("{}/sell/inventory/v1/inventory_item/{}", self.base(), urlencoding::encode(sku));

    let body = json!({
      "availability": { "shipToLocationAvailability": { "quantity": 1 } },
      "condition": condition_id,
      "product": {
        "title": title,
        "description": description_html,
        "imageUrls": image_urls,
        "aspects": {},
      },
    });

    let res = http_client::shared()
      .put(url)
      .header("Authorization", format!("Bearer {}", self.access_token))
      .header("Content-Type", "application/json")
      .header("Content-Language", "en-US")
      .json(&body)
      .send()
      .await?;
    
    Self::ok_or_body(res).await
  }

  pub async fn create_offer(
    &self, 
    sku: &str,
    marketplace_id: &str,
    category_id: &str,
    price_value: &str,
    currency: &str, 
    fulfillment_policy_id: &str, 
    payment_policy_id: &str, 
    return_policy_id: &str,
    merchant_location_key: &str,
  ) -> Result<String, EbayInventoryError> {

    let url = format!("{}/sell/inventory/v1/offer", self.base());

    let body = json!({
      "sku": sku,
      "marketplaceId": marketplace_id,
      "format": "FIXED_PRICE",
      "categoryId": category_id,
      "listingPolicies": {
        "fulfillmentPolicyId": fulfillment_policy_id,
        "paymentPolicyId": payment_policy_id,
        "returnPolicyId": return_policy_id,
      },
      "pricingSummary": {
        "price": {
          "value": price_value,
          "currency": currency,
        },
      },
      "merchantLocationKey": merchant_location_key,
    });

    let res = http_client::shared()
      .post(url)
      .header("Authorization", format!("Bearer {}", self.access_token))
      .header("Content-Type", "application/json") 
      .json(&body)
      .send()
      .await?;

    let status = res.status();
    let body = res.text().await?;

    if !status.is_success() {
      return Err(EbayInventoryError::Api { status, body });
    }

    let v: serde_json::Value = serde_json::from_str(&body)?; 
    Ok(v["offerId"].as_str().unwrap_or_default().to_string())
  }

  pub async fn publish_offer(&self, offer_id: &str) -> Result<serde_json::Value, EbayInventoryError> {
    let url = format!("{}/sell/inventory/v1/offer/{}/publish", self.base(), offer_id);

    let res = http_client::shared() 
      .post(url)
      .header("Authorization", format!("Bearer {}", self.access_token))
      .header("Content-Type", "application/json")
      .json(&json!({}))
      .send()
      .await?;

    let status = res.status();
    let body = res.text().await?;

    if !status.is_success() {
      return Err(EbayInventoryError::Api { status, body });
    }

    Ok(serde_json::from_str(&body)?)
  }

  async fn ok_or_body(res: reqwest::Response) -> Result<(), EbayInventoryError> { 
    let status = res.status();
    let body = res.text().await?;

    if !status.is_success() {
      return Err(EbayInventoryError::Api { status, body });
    }

    Ok(())
  }
}