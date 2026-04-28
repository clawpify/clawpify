use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

/// Stored publication attempt for a listing/channel pair.
#[derive(Debug, sqlx::FromRow)]
pub struct ListingPublication {
  pub id: Uuid,
  pub listing_id: Uuid,
  pub channel_connection_id: Uuid,
  pub channel: String,
  pub shopify_product_gid: Option<String>,
  pub status: String,
  pub error_message: Option<String>,
  pub payload_snapshot: Option<serde_json::Value>,
  pub created_at: DateTime<Utc>,
}

/// Generic insert used by existing channel publication flows.
pub async fn insert(
  pool: &PgPool,
  listing_id: Uuid,
  channel_connection_id: Uuid,
  channel: &str,
  status: &str,
  error_message: Option<&str>,
  payload_snapshot: Option<serde_json::Value>,
  shopify_product_gid: Option<&str>,
) -> Result<Uuid, sqlx::Error> {
  let id: (Uuid,) = sqlx::query_as(
    r#"INSERT INTO listing_publications (
         listing_id, channel_connection_id, channel, shopify_product_gid,
         status, error_message, payload_snapshot
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id"#,
  )
  .bind(listing_id)
  .bind(channel_connection_id)
  .bind(channel)
  .bind(shopify_product_gid)
  .bind(status)
  .bind(error_message)
  .bind(payload_snapshot)
  .fetch_one(pool)
  .await?;
  Ok(id.0)
}

/// Store an eBay draft offer as a pending listing publication.
pub async fn insert_ebay_draft(
  pool: &PgPool,
  listing_id: Uuid,
  channel_connection_id: Uuid,
  snapshot: serde_json::Value,
) -> Result<Uuid, sqlx::Error> {
  insert(
    pool,
    listing_id,
    channel_connection_id,
    "ebay",
    "pending",
    None,
    Some(snapshot),
    None,
  )
  .await
}

/// Find the newest pending eBay draft for a listing.
pub async fn latest_pending_ebay_draft(
  pool: &PgPool,
  listing_id: Uuid,
) -> Result<Option<ListingPublication>, sqlx::Error> {
  sqlx::query_as::<_, ListingPublication>(
    r#"SELECT id, listing_id, channel_connection_id, channel, shopify_product_gid,
       status, error_message, payload_snapshot, created_at
       FROM listing_publications
       WHERE listing_id = $1 AND channel = 'ebay' AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1"#,
  )
  .bind(listing_id)
  .fetch_optional(pool)
  .await
}

/// Mark a publication as successful and replace its payload snapshot.
pub async fn mark_success(
  pool: &PgPool,
  id: Uuid,
  snapshot: serde_json::Value,
) -> Result<(), sqlx::Error> {
  sqlx::query(
    r#"UPDATE listing_publications
       SET status = 'success', error_message = NULL, payload_snapshot = $2
       WHERE id = $1"#,
  )
  .bind(id)
  .bind(snapshot)
  .execute(pool)
  .await?;
  Ok(())
}

/// Mark a publication as failed while preserving eBay/API context in snapshot.
pub async fn mark_failed(
  pool: &PgPool,
  id: Uuid,
  error_message: &str,
  snapshot: serde_json::Value,
) -> Result<(), sqlx::Error> {
  sqlx::query(
    r#"UPDATE listing_publications
       SET status = 'failed', error_message = $2, payload_snapshot = $3
       WHERE id = $1"#,
  )
  .bind(id)
  .bind(error_message)
  .bind(snapshot)
  .execute(pool)
  .await?;
  Ok(())
}
