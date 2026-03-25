use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use chacha20poly1305::{
  aead::{Aead, AeadCore, KeyInit, OsRng},
  XChaCha20Poly1305, XNonce,
};

#[derive(Debug, Clone)]
pub enum TokenCryptoError {
  BadKey,
  Encrypt,
  Decrypt,
}

pub struct TokenCrypto {
  key: [u8; 32],
}

impl TokenCrypto {
  pub fn from_env() -> Result<Self, TokenCryptoError> {
    let s = std::env::var("CHANNEL_ENCRYPTION_KEY").map_err(|_| TokenCryptoError::BadKey)?;
    let s = s.trim();
    let key: [u8; 32] = if s.len() == 64 && s.chars().all(|c| c.is_ascii_hexdigit()) {
      hex::decode(s)
        .map_err(|_| TokenCryptoError::BadKey)?
        .try_into()
        .map_err(|_| TokenCryptoError::BadKey)?
    } else {
      let raw = B64.decode(s.as_bytes()).map_err(|_| TokenCryptoError::BadKey)?;
      raw.try_into().map_err(|_| TokenCryptoError::BadKey)?
    };
    Ok(Self { key })
  }

  /// Returns `(nonce, ciphertext)` for `BYTEA` columns.
  pub fn encrypt_json(&self, plaintext: &str) -> Result<(Vec<u8>, Vec<u8>), TokenCryptoError> {
    let cipher = XChaCha20Poly1305::new(&self.key.into());
    let nonce = XChaCha20Poly1305::generate_nonce(&mut OsRng);
    let ct = cipher
      .encrypt(&nonce, plaintext.as_bytes())
      .map_err(|_| TokenCryptoError::Encrypt)?;
    Ok((nonce.to_vec(), ct))
  }

  pub fn decrypt_json(&self, nonce: &[u8], ciphertext: &[u8]) -> Result<String, TokenCryptoError> {
    let cipher = XChaCha20Poly1305::new(&self.key.into());
    let nonce = XNonce::from_slice(nonce);
    let pt = cipher
      .decrypt(nonce, ciphertext)
      .map_err(|_| TokenCryptoError::Decrypt)?;
    String::from_utf8(pt).map_err(|_| TokenCryptoError::Decrypt)
  }
}

#[cfg(test)]
impl TokenCrypto {
  fn from_key(key: [u8; 32]) -> Self {
    Self { key }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn encrypt_decrypt_roundtrip() {
    let crypto = TokenCrypto::from_key(*b"0123456789abcdef0123456789abcdef");
    let secret = r#"{"access_token":"shpat_test"}"#;
    let (nonce, ct) = crypto.encrypt_json(secret).unwrap();
    assert_eq!(crypto.decrypt_json(&nonce, &ct).unwrap(), secret);
  }

  #[test]
  fn decrypt_fails_on_garbage() {
    let crypto = TokenCrypto::from_key(*b"0123456789abcdef0123456789abcdef");
    assert!(crypto.decrypt_json(&[0u8; 24], &[1, 2, 3]).is_err());
  }
}
