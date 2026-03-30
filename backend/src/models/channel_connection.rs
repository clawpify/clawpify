use serde::Serialize;
use uuid::Uuid;

/// Safe to return from the API (no ciphertext).
#[derive(Serialize, sqlx::FromRow)]
pub struct ChannelConnection {
  /* id: The ID of the channel connection. */
  pub id: Uuid,
  /* org_id: The ID of the organization. */
  pub org_id: String,
  /* channel: The channel of the channel connection. */
  pub channel: String,
  /* shop_domain: The shop domain of the channel connection. */
  pub shop_domain: String,
  /* scopes: The scopes of the channel connection. */
  pub scopes: Option<String>,
  /* token_expires_at: The date and time the token expires at. */
  pub token_expires_at: Option<chrono::DateTime<chrono::Utc>>,
  /* created_at: The date and time the channel connection was created. */
  pub created_at: chrono::DateTime<chrono::Utc>,
  /* updated_at: The date and time the channel connection was last updated. */
  pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(sqlx::FromRow)]
pub struct ChannelConnectionSecrets {
  /* id: The ID of the channel connection. */
  pub id: Uuid,
  /* org_id: The ID of the organization. */
  pub org_id: String,
  /* channel: The channel of the channel connection. */
  pub channel: String,
  /* shop_domain: The shop domain of the channel connection. */
  pub shop_domain: String,
  /* scopes: The scopes of the channel connection. */
  pub scopes: Option<String>,
  /* access_token_ciphertext: The ciphertext of the access token. */
  pub access_token_ciphertext: Vec<u8>,
  /* access_token_nonce: The nonce of the access token. */
  pub access_token_nonce: Vec<u8>,
}
