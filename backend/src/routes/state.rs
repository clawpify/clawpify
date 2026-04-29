use aws_sdk_s3::Client;
use sqlx::PgPool;

use crate::crypto::tokens::TokenCrypto;
use crate::integrations::ebay::EbayConfig;

/// Shared application state for Axum handlers ([`State`](axum::extract::State)).
#[derive(Clone)]
pub struct AppState {
  pub pool: PgPool,
  pub s3_client: Option<Client>,
  pub s3_bucket: Option<String>,
  pub ebay_config: Option<EbayConfig>,
  pub token_crypto: Option<TokenCrypto>,
  /// SPA origin for redirects when the public host only reaches this API (e.g. ngrok → Rust).
  pub app_public_origin: Option<String>,
}

impl AppState {
  pub fn new(pool: PgPool) -> Self {
    let (s3_client, s3_bucket) = match crate::s3::try_client_from_env() {
      Some(pair) => (Some(pair.0), Some(pair.1)),
      None => {
        let missing = crate::s3::missing_bucket_env_keys();
        if !missing.is_empty() {
          tracing::warn!(
            ?missing,
            "S3 disabled (503 on POST upload / GET / DELETE /api/v1/s3/objects): set object storage env vars"
          );
        }
        (None, None)
      }
    };

    let ebay_config = match EbayConfig::from_env() {
      Ok(c) => Some(c),
      Err(missing) => {
        tracing::warn!(
          missing,
          "eBay OAuth disabled: set this environment variable (see backend/.env.example); \
           EBAY_DEV_ID is not used by this backend"
        );
        None
      }
    };
    let token_crypto = match TokenCrypto::from_env() {
      Ok(c) => Some(c),
      Err(crate::crypto::tokens::TokenCryptoError::MissingKey) => {
        tracing::warn!(
          "CHANNEL_ENCRYPTION_KEY is not set; encrypted channel tokens (eBay, etc.) will not work"
        );
        None
      }
      Err(crate::crypto::tokens::TokenCryptoError::BadKey) => {
        tracing::warn!(
          "CHANNEL_ENCRYPTION_KEY is invalid (need exactly 32 bytes: 64 hex chars, or base64 from openssl rand -base64 32)"
        );
        None
      }
      Err(e) => {
        tracing::warn!(?e, "TokenCrypto::from_env failed");
        None
      }
    };

    if ebay_config.is_some() && token_crypto.is_none() {
      tracing::warn!("eBay OAuth is configured but TokenCrypto failed; fix CHANNEL_ENCRYPTION_KEY or omit eBay env until fixed");
    }

    let app_public_origin = std::env::var("APP_PUBLIC_ORIGIN")
      .ok()
      .map(|s| s.trim_end_matches('/').to_string())
      .filter(|s| !s.is_empty());

    Self {
      pool,
      s3_client,
      s3_bucket,
      ebay_config,
      token_crypto,
      app_public_origin,
    }
  }
}
