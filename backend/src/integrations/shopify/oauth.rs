//! Shopify Admin OAuth: authorize URL, signed `state`, install HMAC check, access-token exchange.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use hmac::{Hmac, Mac};
use serde::Deserialize;
use sha2::Sha256;
use subtle::ConstantTimeEq;
use url::Url;

use crate::http_client;

type HmacSha256 = Hmac<Sha256>;

pub type OAuthError = String;

const DEFAULT_SCOPES: &str = "read_products,write_products,read_files,write_files";
const MIN_STATE_SECRET_LEN: usize = 16;

// ——— Config ———

#[derive(Debug, Clone)]
pub struct ShopifyOAuthConfig {
  pub api_key: String,
  pub api_secret: String,
  pub redirect_url: String,
  pub scopes: String,
}

impl ShopifyOAuthConfig {
  pub fn from_env() -> Result<Self, OAuthError> {
    Ok(Self {
      api_key: env_required("SHOPIFY_API_KEY")?,
      api_secret: env_required("SHOPIFY_API_SECRET")?,
      redirect_url: env_required("SHOPIFY_OAUTH_REDIRECT_URL")?,
      scopes: std::env::var("SHOPIFY_SCOPES").unwrap_or_else(|_| DEFAULT_SCOPES.to_string()),
    })
  }
}

fn env_required(name: &'static str) -> Result<String, OAuthError> {
  std::env::var(name).map_err(|_| format!("{name} missing"))
}

// ——— Shop host ———

pub fn oauth_state_secret_bytes() -> Result<Vec<u8>, OAuthError> {
  let raw = env_required("OAUTH_STATE_SECRET")?;
  if raw.len() < MIN_STATE_SECRET_LEN {
    return Err("OAUTH_STATE_SECRET too short".into());
  }
  Ok(raw.into_bytes())
}

/// Returns `subdomain.myshopify.com` (lowercase, no scheme or path).
pub fn normalize_shop_domain(shop: &str) -> Result<String, OAuthError> {
  let mut host = shop.trim().to_lowercase();
  if host.is_empty() {
    return Err("shop required".into());
  }
  if let Some(h) = host.strip_prefix("https://") {
    host = h.to_string();
  }
  if let Some(h) = host.strip_prefix("http://") {
    host = h.to_string();
  }
  if let Some(pos) = host.find('/') {
    host.truncate(pos);
  }
  if !host.ends_with(".myshopify.com") || host.matches('.').count() < 2 {
    return Err("shop must be a *.myshopify.com host".into());
  }
  if host.contains("..") || host.contains(':') {
    return Err("invalid shop".into());
  }
  Ok(host)
}

pub fn authorize_url(cfg: &ShopifyOAuthConfig, shop_domain: &str, state: &str) -> Result<String, OAuthError> {
  let mut url = Url::parse(&format!("https://{shop_domain}/admin/oauth/authorize")).map_err(|e| e.to_string())?;
  url
    .query_pairs_mut()
    .append_pair("client_id", &cfg.api_key)
    .append_pair("scope", &cfg.scopes)
    .append_pair("redirect_uri", &cfg.redirect_url)
    .append_pair("state", state);
  Ok(url.into())
}

// ——— Signed CSRF state (Clawpify → Shopify → callback) ———

/// Encode: `base64url(payload) . base64url(hmac_sha256(secret, payload))`.
pub fn sign_state(secret: &[u8], payload: &str) -> Result<String, OAuthError> {
  let sig = hmac_sha256(secret, payload.as_bytes())?;
  Ok(format!(
    "{}.{}",
    URL_SAFE_NO_PAD.encode(payload.as_bytes()),
    URL_SAFE_NO_PAD.encode(sig)
  ))
}

pub fn verify_state(secret: &[u8], state: &str) -> Result<String, OAuthError> {
  let (payload_b64, sig_b64) = state.split_once('.').ok_or_else(|| "invalid state".to_string())?;

  let payload = URL_SAFE_NO_PAD
    .decode(payload_b64.as_bytes())
    .map_err(|_| "invalid state payload".to_string())?;
  let sig = URL_SAFE_NO_PAD
    .decode(sig_b64.as_bytes())
    .map_err(|_| "invalid state signature".to_string())?;

  let expected = hmac_sha256(secret, &payload)?;
  if sig.len() != expected.len() || expected.as_slice().ct_eq(&sig).unwrap_u8() != 1 {
    return Err("state signature mismatch".into());
  }
  String::from_utf8(payload).map_err(|_| "state payload utf-8".into())
}

// ——— Shopify install HMAC on redirect query ———

/// Message Shopify signs: sorted `k=v` pairs, excluding `hmac`, joined with `&`.
pub(crate) fn sorted_oauth_query_string_for_hmac(pairs: &[(String, String)]) -> String {
  let mut parts: Vec<(&str, &str)> = pairs
    .iter()
    .filter(|(k, _)| k != "hmac")
    .map(|(k, v)| (k.as_str(), v.as_str()))
    .collect();
  parts.sort_by(|a, b| a.0.cmp(b.0));
  parts
    .iter()
    .map(|(k, v)| format!("{k}={v}"))
    .collect::<Vec<_>>()
    .join("&")
}

/// See <https://shopify.dev/docs/apps/auth/oauth/getting-started>.
pub fn verify_shopify_install_hmac(query_pairs: &[(String, String)], secret: &str, their_hmac_hex: &str) -> bool {
  let Ok(mut mac) = HmacSha256::new_from_slice(secret.as_bytes()) else {
    return false;
  };
  mac.update(sorted_oauth_query_string_for_hmac(query_pairs).as_bytes());
  let ours = hex::encode(mac.finalize().into_bytes());
  let their = their_hmac_hex.to_lowercase();
  their.len() == ours.len() && ours.as_bytes().ct_eq(their.as_bytes()).unwrap_u8() == 1
}

// ——— Access token ———

#[derive(Deserialize)]
pub struct AccessTokenResponse {
  pub access_token: String,
  pub scope: Option<String>,
}

/// Authorization-code exchange per [Shopify OAuth](https://shopify.dev/docs/apps/auth/oauth/getting-started) (`application/x-www-form-urlencoded`).
pub async fn exchange_code(shop_domain: &str, cfg: &ShopifyOAuthConfig, code: &str) -> Result<AccessTokenResponse, OAuthError> {
  let url = format!("https://{shop_domain}/admin/oauth/access_token");
  let form = [
    ("client_id", cfg.api_key.as_str()),
    ("client_secret", cfg.api_secret.as_str()),
    ("code", code),
  ];
  let res = http_client::shared()
    .post(&url)
    .header(reqwest::header::ACCEPT, "application/json")
    .form(&form)
    .send()
    .await
    .map_err(|e| e.to_string())?;
  if !res.status().is_success() {
    return Err(format!("token exchange failed: {}", res.text().await.unwrap_or_default()));
  }
  res.json().await.map_err(|e| e.to_string())
}

// ——— crypto helpers ———

fn hmac_sha256(key: &[u8], msg: &[u8]) -> Result<Vec<u8>, OAuthError> {
  let mut mac = HmacSha256::new_from_slice(key).map_err(|_| "invalid HMAC key length".to_string())?;
  mac.update(msg);
  Ok(mac.finalize().into_bytes().to_vec())
}
