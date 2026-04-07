//! Clerk session JWT verification (RS256 + JWKS) for direct browser → Rust calls.
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use rsa::pkcs8::{EncodePublicKey, LineEnding};
use rsa::{BigUint, RsaPublicKey};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct OrgBlock {
  id: String,
}

#[derive(Debug, Deserialize)]
pub struct ClerkSessionClaims {
  pub sub: String,
  #[serde(default)]
  org_id: Option<String>,
  #[serde(rename = "o", default)]
  org_block: Option<OrgBlock>,
}

impl ClerkSessionClaims {
  pub fn internal_org_scope(&self) -> String {
    if let Some(ref id) = self.org_id {
      return id.clone();
    }
    if let Some(ref o) = self.org_block {
      return o.id.clone();
    }
    format!("user:{}", self.sub)
  }
}

/// RSA `(n,e)` for `kid`; JWKS may include non-RSA keys, so we scan entries instead of deserializing the full array.
fn rsa_components_for_kid(keys: &[serde_json::Value], kid: &str) -> Result<(String, String), String> {
  for k in keys {
    if k.get("kid").and_then(|v| v.as_str()) != Some(kid) {
      continue;
    }
    if k.get("kty").and_then(|v| v.as_str()) != Some("RSA") {
      continue;
    }
    let Some(n) = k.get("n").and_then(|v| v.as_str()).map(str::to_string) else {
      continue;
    };
    let Some(e) = k.get("e").and_then(|v| v.as_str()).map(str::to_string) else {
      continue;
    };
    return Ok((n, e));
  }
  Err(format!("no RSA JWK with kid={kid}"))
}

fn decoding_key_from_rsa_components(n_b64: &str, e_b64: &str) -> Result<DecodingKey, String> {
  let n = URL_SAFE_NO_PAD
    .decode(n_b64.as_bytes())
    .map_err(|e| format!("jwks n b64: {e}"))?;
  let e = URL_SAFE_NO_PAD
    .decode(e_b64.as_bytes())
    .map_err(|e| format!("jwks e b64: {e}"))?;
  let n = BigUint::from_bytes_be(&n);
  let e = BigUint::from_bytes_be(&e);
  let pub_key = RsaPublicKey::new(n, e).map_err(|e| format!("RSA pubkey: {e}"))?;
  let pem = pub_key
    .to_public_key_pem(LineEnding::LF)
    .map_err(|e| format!("PEM: {e}"))?;
  DecodingKey::from_rsa_pem(pem.as_bytes()).map_err(|e| format!("decoding key: {e}"))
}

pub async fn verify_session_token(jwks_url: &str, token: &str) -> Result<ClerkSessionClaims, String> {
  let hdr = decode_header(token).map_err(|e| format!("jwt header: {e}"))?;
  let kid = hdr.kid.ok_or_else(|| "jwt header: missing kid".to_string())?;
  let alg = hdr.alg;
  if alg != jsonwebtoken::Algorithm::RS256 {
    return Err(format!(
      "jwt alg is {alg:?}; only RS256 session tokens are supported (Clerk EC/ES256 not implemented)"
    ));
  }

  let body = reqwest::get(jwks_url)
    .await
    .map_err(|e| format!("jwks fetch {jwks_url}: {e}"))?
    .text()
    .await
    .map_err(|e| format!("jwks body: {e}"))?;
  let v: serde_json::Value =
    serde_json::from_str(&body).map_err(|e| format!("jwks json: {e}"))?;
  let keys = v["keys"].as_array().ok_or_else(|| "jwks: missing keys array".to_string())?;
  let (n, e) = rsa_components_for_kid(keys, &kid)?;
  let key = decoding_key_from_rsa_components(&n, &e)?;
  let mut validation = Validation::new(Algorithm::RS256);
  validation.validate_aud = false;
  if let Ok(iss) = std::env::var("CLERK_JWT_ISSUER") {
    if !iss.is_empty() {
      validation.set_issuer(&[iss]);
    }
  }
  decode::<ClerkSessionClaims>(token, &key, &validation)
    .map(|c| c.claims)
    .map_err(|e| e.to_string())
}
