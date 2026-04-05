use reqwest::StatusCode;
use url::Url;

use super::config::EbayConfig;
use crate::http_client;

#[derive(Debug, thiserror::Error)]
pub enum EbayClientError {
  #[error("http: {0}")]
  Http(#[from] reqwest::Error),
  #[error("url: {0}")]
  Url(#[from] url::ParseError),
  #[error("ebay api {status}: {body}")]
  Api { status: StatusCode, body: String },
}

pub struct EbayRestClient<'a> {
  pub cfg: &'a EbayConfig,
  pub access_token: String,
}

impl<'a> EbayRestClient<'a> {
  fn inventory_item_url(&self, sku: &str) -> Result<Url, url::ParseError> {
    let base = self.cfg.api_base_url().trim_end_matches('/');

    let mut u = Url::parse(base)?;

    u.path_segments_mut()
      .map_err(|_| url::ParseError::EmptyHost)?
      .push("sell")
      .push("inventory")
      .push("v1")
      .push("inventory_item")
      .push(sku);
    Ok(u)
  }

  pub async fn get_inventory_item(&self, sku: &str) -> Result<String, EbayClientError> {
    let client = http_client::shared(); 

    let url = self.inventory_item_url(sku)?;

    let res = client
      .get(url) 
      .header("Authorization", format!("Bearer {}", self.access_token))
      .send()
      .await?;
    
    let status = res.status(); 
    let body   = res.text().await?;

    if !status.is_success() {
      return Err(EbayClientError::Api { status, body });
    }

    Ok(body)
  }
}
