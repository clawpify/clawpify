use std::collections::BTreeMap;

use axum::http::HeaderMap;
use base64::Engine;
use hmac::{Hmac, Mac};
use sha1::Sha1;
use subtle::ConstantTimeEq;

use crate::error::{self, ApiError};

type HmacSha1 = Hmac<Sha1>;

/// Twilio request validation: HMAC-SHA1 of `url + concat(sorted param names and values)` (no delimiters),
/// then Base64. See https://www.twilio.com/docs/usage/webhooks/webhooks-security
pub fn verify_twilio_request(
  auth_token: &str,
  request_url: &str,
  params: &BTreeMap<String, String>,
  signature_b64: &str,
) -> Result<(), ApiError> {
  let mut payload = String::with_capacity(request_url.len().max(64) + params.len() * 24);
  payload.push_str(request_url);
  for (k, v) in params {
    payload.push_str(k);
    payload.push_str(v);
  }

  let mut mac = HmacSha1::new_from_slice(auth_token.as_bytes())
    .map_err(|_| error::internal("invalid Twilio auth token length"))?;
  mac.update(payload.as_bytes());
  let digest = mac.finalize().into_bytes();

  let expected = base64::engine::general_purpose::STANDARD
    .decode(signature_b64.trim().as_bytes())
    .map_err(|_| {
      error::bad_request("Invalid Twilio signature encoding")
    })?;

  if expected.len() != digest.len() || !bool::from(expected.as_slice().ct_eq(digest.as_slice())) {
    return Err(error::bad_request("Twilio signature mismatch"));
  }

  Ok(())
}

/// Full URL Twilio requested (scheme + host + path, no query). Prefer `TWILIO_WEBHOOK_URL` when behind proxies.
pub fn twilio_request_url(headers: &HeaderMap, path: &str) -> Result<String, ApiError> {
  if let Ok(u) = std::env::var("TWILIO_WEBHOOK_URL") {
    let t = u.trim();
    if !t.is_empty() {
      return Ok(t.trim_end_matches('/').to_string());
    }
  }

  let proto = headers
    .get("x-forwarded-proto")
    .and_then(|h| h.to_str().ok())
    .unwrap_or("https");

  let host = headers
    .get("host")
    .and_then(|h| h.to_str().ok())
    .ok_or_else(|| error::bad_request("Host required for Twilio signature (set TWILIO_WEBHOOK_URL or forward Host)"))?;

  Ok(format!("{}://{}{}", proto, host, path))
}
