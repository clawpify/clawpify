// backend/src/integrations/ebay/token_service.rs
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::crypto::tokens::TokenCrypto;
use crate::integrations::ebay::config::EbayConfig;
use crate::integrations::ebay::oauth;
use crate::repositories::channel_connections;

#[derive(Serialize, Deserialize)]
struct StoredEbayTokens {
  access_token: String,
  refresh_token: String,
}

pub struct EbayTokenService<'a> {
  pub pool: &'a PgPool,
  pub cfg: &'a EbayConfig,
  pub crypto: &'a TokenCrypto,
}

const SKEW_SECS: i64 = 120;

impl<'a> EbayTokenService<'a> {
  pub async fn bearer_for_org(&self, org_id: &str) -> Result<String, EbayTokenError> {
    let row = channel_connections::get_ebay_secrets(self.pool, org_id)
      .await?
      .ok_or(EbayTokenError::NotConnected)?;

    let json = self
      .crypto
      .decrypt_json(&row.access_token_nonce, &row.access_token_ciphertext)?;
    let mut tok: StoredEbayTokens = serde_json::from_str(&json)?;

    let expired = row
      .token_expires_at
      .map(|t| t < chrono::Utc::now() + chrono::Duration::seconds(SKEW_SECS))
      .unwrap_or(true);

    if expired {
      let refreshed = oauth::refresh_access_token(self.cfg, &tok.refresh_token).await?;
      tok.access_token = refreshed.access_token;
      if let Some(rt) = refreshed.refresh_token {
        tok.refresh_token = rt;
      }
      let json = serde_json::to_string(&tok)?;
      let (nonce, ct) = self.crypto.encrypt_json(&json)?;
      let exp = chrono::Utc::now() + chrono::Duration::seconds(refreshed.expires_in);
      channel_connections::upsert_ebay(
        self.pool,
        org_id,
        row.scopes.as_deref(),
        ct.as_slice(),
        nonce.as_slice(),
        Some(exp),
      )
      .await?;
    }

    Ok(tok.access_token)
  }
}

#[derive(Debug, thiserror::Error)]
pub enum EbayTokenError {
  #[error("ebay not connected")]
  NotConnected,
  #[error(transparent)]
  Db(#[from] sqlx::Error),
  #[error(transparent)]
  Crypto(#[from] crate::crypto::tokens::TokenCryptoError),
  #[error(transparent)]
  Json(#[from] serde_json::Error),
  #[error(transparent)]
  OAuth(#[from] crate::integrations::ebay::oauth::EbayOAuthError),
}