use serde::Serialize;
use sha2::{Digest, Sha256};

pub fn body_hash<T: Serialize>(body: &T) -> Result<String, serde_json::Error> {
  let v = serde_json::to_value(body)?;
  let bytes = serde_json::to_vec(&v)?;
  Ok(hex::encode(Sha256::digest(bytes)))
}
