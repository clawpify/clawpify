use serde::Serialize;
use uuid::Uuid;

/// Safe to return from the API (no ciphertext).
#[derive(Serialize, sqlx::FromRow)]
pub struct ChannelConnection {
  pub id: Uuid,                                                // id
  pub org_id: String,                                          // org id
  pub channel: String,                                         // channel
  pub shop_domain: String,                                     // shop domain
  pub scopes: Option<String>,                                  // scopes
  pub token_expires_at: Option<chrono::DateTime<chrono::Utc>>, // token expires at
  pub created_at: chrono::DateTime<chrono::Utc>,               // created at
  pub updated_at: chrono::DateTime<chrono::Utc>,               // updated at
}

#[derive(sqlx::FromRow)]
pub struct ChannelConnectionSecrets {
  pub id: Uuid,                                                // id
  pub org_id: String,                                          // org id
  pub channel: String,                                         // channel
  pub shop_domain: String,                                     // shop domain
  pub scopes: Option<String>,                                  // scopes
  pub access_token_ciphertext: Vec<u8>,                        // access token ciphertext
  pub access_token_nonce: Vec<u8>,                             // access token nonce
  pub token_expires_at: Option<chrono::DateTime<chrono::Utc>>, // token expires at
}
