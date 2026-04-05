use base64::{engine::general_purpose::STANDARD, Engine as _};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use reqwest::StatusCode;

use super::config::EbayConfig;
use super::types::{OAuthErrorBody, TokenResponse};
use crate::http_client;

#[derive(Debug, thiserror::Error)]
pub enum EbayOAuthError {
  #[error("http: {0}")]
  Http(#[from] reqwest::Error),
  #[error("ebay token {status}: {body}")]
  Ebay { status: StatusCode, body: String },
  #[error("ebay json: {0}")]
  Json(#[from] serde_json::Error),
}

fn basic_auth_header(client_id: &str, client_secret: &str) -> String {
  let creds = format!("{}:{}", client_id, client_secret);
  format!("Basic {}", STANDARD.encode(creds.as_bytes()))
}

pub async fn exchange_code_for_token(
  cfg: &EbayConfig,
  code: &str,
) -> Result<TokenResponse, EbayOAuthError> {
  let client = http_client::shared();

  let res = client
    .post(cfg.oauth_token_url())
    .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
    .header(AUTHORIZATION, basic_auth_header(&cfg.client_id, &cfg.client_secret))
    .form(&[
      ("grant_type", "authorization_code"),
      ("code", code),
      ("redirect_uri", cfg.oauth_redirect_uri.as_str()),
    ])
    .send()
    .await?;

  let status = res.status();
  let body = res.text().await?;

  if !status.is_success() {
    return Err(EbayOAuthError::Ebay { status, body });
  }

  Ok(serde_json::from_str(&body)?)
}

pub async fn refresh_access_token(
  cfg: &EbayConfig,
  refresh_token: &str,
) -> Result<TokenResponse, EbayOAuthError> {
  let client = http_client::shared();

  let mut form: Vec<(&str, &str)> = vec![
    ("grant_type", "refresh_token"),
    ("refresh_token", refresh_token),
  ];
  if !cfg.oauth_scope.is_empty() {
    form.push(("scope", cfg.oauth_scope.as_str()));
  }

  let res = client
    .post(cfg.oauth_token_url())
    .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
    .header(
      AUTHORIZATION,
      basic_auth_header(&cfg.client_id, &cfg.client_secret),
    )
    .form(&form)
    .send()
    .await?;

  let status = res.status();
  let body = res.text().await?;

  if !status.is_success() {
    return Err(EbayOAuthError::Ebay { status, body });
  }

  Ok(serde_json::from_str(&body)?)
}

pub fn authorize_url(cfg: &EbayConfig, state: &str) -> String {
  let scope_enc = urlencoding::encode(&cfg.oauth_scope);
  format!(
    "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&state={}",
    cfg.auth_authorize_url(),
    urlencoding::encode(&cfg.client_id),
    urlencoding::encode(&cfg.oauth_redirect_uri),
    scope_enc,
    urlencoding::encode(state),
  )
}

pub fn parse_oauth_error_body(raw: &str) -> Option<String> {
  serde_json::from_str::<OAuthErrorBody>(raw)
    .ok()
    .map(|e| e.error_description.unwrap_or(e.error))
}
