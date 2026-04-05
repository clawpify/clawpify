use chacha20poly1305::aead::{Aead, KeyInit, OsRng};
use chacha20poly1305::{AeadCore, ChaCha20Poly1305};

#[derive(Debug)]
pub enum TokenCryptoError {
  MissingKey,
  BadKey,
  Encrypt(chacha20poly1305::Error),
}

#[derive(Clone)]
pub struct TokenCrypto {
  cipher: ChaCha20Poly1305,
}

impl TokenCrypto {
  pub fn from_env() -> Result<Self, TokenCryptoError> {
    let hex = std::env::var("CHANNEL_ENCRYPTION_KEY").map_err(|_| TokenCryptoError::MissingKey)?;
    let raw = hex::decode(hex.trim()).map_err(|_| TokenCryptoError::BadKey)?;
    if raw.len() != 32 {
      return Err(TokenCryptoError::BadKey);
    }
    let key = chacha20poly1305::Key::from_slice(&raw);
    Ok(Self {
      cipher: ChaCha20Poly1305::new(key),
    })
  }

  /// Returns `(nonce, ciphertext)` where `ciphertext` includes the Poly1305 tag.
  pub fn encrypt_json(&self, json: &str) -> Result<(Vec<u8>, Vec<u8>), TokenCryptoError> {
    let nonce = ChaCha20Poly1305::generate_nonce(&mut OsRng);
    let ct = self
      .cipher
      .encrypt(&nonce, json.as_bytes())
      .map_err(TokenCryptoError::Encrypt)?;
    Ok((nonce.to_vec(), ct))
  }
}
