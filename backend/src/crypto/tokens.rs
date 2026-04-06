use base64::{engine::general_purpose::STANDARD, Engine as _};
use chacha20poly1305::aead::{Aead, KeyInit, OsRng};
use chacha20poly1305::{AeadCore, ChaCha20Poly1305, Key, Nonce};

#[derive(Debug, thiserror::Error)]
pub enum TokenCryptoError {
  #[error("CHANNEL_ENCRYPTION_KEY is not set")]
  MissingKey,
  #[error("CHANNEL_ENCRYPTION_KEY is invalid")]
  BadKey,
  #[error("token encryption failed")]
  Encrypt(#[source] chacha20poly1305::Error),
  #[error("token decryption failed")]
  Decrypt(#[source] chacha20poly1305::Error),
  #[error(transparent)]
  Utf8(#[from] std::string::FromUtf8Error),
}

#[derive(Clone)]
pub struct TokenCrypto {
  cipher: ChaCha20Poly1305,
}


fn decode_32_byte_key(raw: &str) -> Result<[u8; 32], TokenCryptoError> {
  let s = raw.trim();
  if s.len() == 64 && s.as_bytes().iter().all(|b| b.is_ascii_hexdigit()) {
    let v = hex::decode(s).map_err(|_| TokenCryptoError::BadKey)?;
    v.try_into().map_err(|_| TokenCryptoError::BadKey)
  } else {
    let v = STANDARD.decode(s).map_err(|_| TokenCryptoError::BadKey)?;
    v.try_into().map_err(|_| TokenCryptoError::BadKey)
  }
}

impl TokenCrypto {
  pub fn from_env() -> Result<Self, TokenCryptoError> {
    let raw = std::env::var("CHANNEL_ENCRYPTION_KEY").map_err(|_| TokenCryptoError::MissingKey)?;
    let key_bytes = decode_32_byte_key(&raw)?;
    let key = Key::from_slice(&key_bytes);

    Ok(Self {
      cipher: ChaCha20Poly1305::new(key),
    })
  }

  pub fn encrypt_json(&self, json: &str) -> Result<(Vec<u8>, Vec<u8>), TokenCryptoError> {
    let nonce = ChaCha20Poly1305::generate_nonce(&mut OsRng);

    let ct = self
      .cipher
      .encrypt(&nonce, json.as_bytes())
      .map_err(TokenCryptoError::Encrypt)?;

    Ok((nonce.to_vec(), ct))
  }

  pub fn decrypt_json(&self, nonce: &[u8], ciphertext: &[u8]) -> Result<String, TokenCryptoError> {
    let nonce = Nonce::from_slice(nonce);
    let plain = self
      .cipher
      .decrypt(nonce, ciphertext)
      .map_err(TokenCryptoError::Decrypt)?;
    Ok(String::from_utf8(plain)?)
  }
}