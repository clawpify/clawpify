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
    .header(
      AUTHORIZATION,
      basic_auth_header(&cfg.client_id, &cfg.client_secret),
    )
    .form(&[
      ("grant_type", "authorization_code"),
      ("code", code),
      ("redirect_uri", cfg.oauth_ru_name.as_str()),
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

  // Omit scope on refresh so eBay defaults to the scopes granted during consent.
  // Sending env scopes here can trigger invalid_scope if config drifts from the refresh token grant.
  let form: Vec<(&str, &str)> = vec![
    ("grant_type", "refresh_token"),
    ("refresh_token", refresh_token),
  ];

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
  // eBay rejects `scope` when spaces are encoded as `+` in the query string; use `%20` between scope URLs.
  let scope_enc = urlencoding::encode(&cfg.oauth_scope).replace('+', "%20");
  let client_id_prefix: String = cfg.client_id.chars().take(8).collect();
  let redirect_uri_looks_like_url =
    cfg.oauth_ru_name.starts_with("http://") || cfg.oauth_ru_name.starts_with("https://");
  tracing::info!(
    sandbox = cfg.sandbox,
    client_id_prefix = %client_id_prefix,
    redirect_uri = %cfg.oauth_ru_name,
    redirect_uri_looks_like_url,
    scope_count = cfg.oauth_scope.split_whitespace().count(),
    scope_len = cfg.oauth_scope.len(),
    "building eBay OAuth authorize URL; EBAY_OAUTH_REDIRECT_URI must contain the eBay RuName"
  );
  format!(
    "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&state={}",
    cfg.auth_authorize_url(),
    urlencoding::encode(&cfg.client_id),
    urlencoding::encode(&cfg.oauth_ru_name),
    scope_enc,
    urlencoding::encode(state),
  )
}

pub fn parse_oauth_error_body(raw: &str) -> Option<String> {
  serde_json::from_str::<OAuthErrorBody>(raw)
    .ok()
    .map(|e| e.error_description.unwrap_or(e.error))
}
