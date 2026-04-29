use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use subtle::ConstantTimeEq;
use uuid::Uuid;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Serialize, Deserialize)]
pub struct StatePayload {
  pub org_id: String,
  pub exp_unix: i64,
  pub nonce: String,
}

#[derive(Debug, thiserror::Error)]
pub enum StateTokenError {
  #[error("format")]
  Format,
  #[error("bad signature")]
  BadSig,
  #[error("expired")]
  Expired,
}

pub fn sign_state(secret: &[u8], org_id: &str, ttl_secs: i64) -> Result<String, StateTokenError> {
  let exp = chrono::Utc::now().timestamp() + ttl_secs;
  let payload = StatePayload {
    org_id: org_id.to_string(),
    exp_unix: exp,
    nonce: Uuid::new_v4().to_string(),
  };
  let json = serde_json::to_vec(&payload).map_err(|_| StateTokenError::Format)?;
  let mut mac = HmacSha256::new_from_slice(secret).map_err(|_| StateTokenError::Format)?;
  mac.update(&json);
  let sig = mac.finalize().into_bytes();
  Ok(format!(
    "{}.{}",
    URL_SAFE_NO_PAD.encode(json),
    URL_SAFE_NO_PAD.encode(sig)
  ))
}

pub fn verify_state(secret: &[u8], token: &str) -> Result<StatePayload, StateTokenError> {
  let (p, s) = token.split_once('.').ok_or(StateTokenError::Format)?;
  let json = URL_SAFE_NO_PAD
    .decode(p)
    .map_err(|_| StateTokenError::Format)?;
  let sig = URL_SAFE_NO_PAD
    .decode(s)
    .map_err(|_| StateTokenError::Format)?;
  let mut mac = HmacSha256::new_from_slice(secret).map_err(|_| StateTokenError::Format)?;
  mac.update(&json);
  let expected = mac.finalize().into_bytes();

  if expected.as_slice().ct_eq(&sig[..]).unwrap_u8() != 1 {
    return Err(StateTokenError::BadSig);
  }

  let payload: StatePayload = serde_json::from_slice(&json).map_err(|_| StateTokenError::Format)?;

  if chrono::Utc::now().timestamp() > payload.exp_unix {
    return Err(StateTokenError::Expired);
  }

  Ok(payload)
}
