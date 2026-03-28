use sqlx::PgPool;

use crate::models::channel_connection::{ChannelConnection, ChannelConnectionSecrets};

pub async fn list_by_org(pool: &PgPool, org_id: &str) -> Result<Vec<ChannelConnection>, sqlx::Error> {
  sqlx::query_as::<_, ChannelConnection>(
    r#"SELECT id, org_id, channel, shop_domain, scopes, token_expires_at, created_at, updated_at
       FROM channel_connections
       WHERE org_id = $1
       ORDER BY updated_at DESC"#,
  )
  .bind(org_id)
  .fetch_all(pool)
  .await
}

pub async fn get_shopify_secrets(
  pool: &PgPool,
  org_id: &str,
) -> Result<Option<ChannelConnectionSecrets>, sqlx::Error> {
  sqlx::query_as::<_, ChannelConnectionSecrets>(
    r#"SELECT id, org_id, channel, shop_domain, scopes, access_token_ciphertext, access_token_nonce
       FROM channel_connections
       WHERE org_id = $1 AND channel = 'shopify'"#,
  )
  .bind(org_id)
  .fetch_optional(pool)
  .await
}

pub async fn upsert_shopify(
  pool: &PgPool,
  org_id: &str,
  shop_domain: &str,
  scopes: Option<&str>,
  access_token_ciphertext: &[u8],
  access_token_nonce: &[u8],
  token_expires_at: Option<chrono::DateTime<chrono::Utc>>,
) -> Result<ChannelConnection, sqlx::Error> {
  sqlx::query("INSERT INTO organizations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING")
    .bind(org_id)
    .execute(pool)
    .await?;

  sqlx::query_as::<_, ChannelConnection>(
    r#"INSERT INTO channel_connections (
          org_id, channel, shop_domain, scopes,
          access_token_ciphertext, access_token_nonce, token_expires_at, updated_at
        )
        VALUES ($1, 'shopify', $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (org_id, channel) DO UPDATE SET
          shop_domain = EXCLUDED.shop_domain,
          scopes = EXCLUDED.scopes,
          access_token_ciphertext = EXCLUDED.access_token_ciphertext,
          access_token_nonce = EXCLUDED.access_token_nonce,
          token_expires_at = EXCLUDED.token_expires_at,
          updated_at = NOW()
        RETURNING id, org_id, channel, shop_domain, scopes, token_expires_at, created_at, updated_at"#,
  )
  .bind(org_id)
  .bind(shop_domain)
  .bind(scopes)
  .bind(access_token_ciphertext)
  .bind(access_token_nonce)
  .bind(token_expires_at)
  .fetch_one(pool)
  .await
}
