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

    let ebay_config = EbayConfig::from_env().ok();
    let token_crypto = TokenCrypto::from_env().ok();

    if ebay_config.is_some() && token_crypto.is_none() {
      tracing::warn!(
        "eBay OAuth env vars are set but CHANNEL_ENCRYPTION_KEY is missing; eBay token storage will fail"
      );
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
