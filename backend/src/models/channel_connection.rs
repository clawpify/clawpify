use serde::Serialize;
use uuid::Uuid;

/// Safe to return from the API (no ciphertext).
#[derive(Serialize, sqlx::FromRow)]
pub struct ChannelConnection {
  pub id: Uuid,
  pub org_id: String,
  pub channel: String,
  pub shop_domain: String,
  pub scopes: Option<String>,
  pub token_expires_at: Option<chrono::DateTime<chrono::Utc>>,
  pub created_at: chrono::DateTime<chrono::Utc>,
  pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(sqlx::FromRow)]
pub struct ChannelConnectionSecrets {
  pub id: Uuid,
  pub org_id: String,
  pub channel: String,
  pub shop_domain: String,
  pub scopes: Option<String>,
  pub access_token_ciphertext: Vec<u8>,
  pub access_token_nonce: Vec<u8>,
}
