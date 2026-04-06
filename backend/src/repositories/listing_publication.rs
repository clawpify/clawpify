// backend/src/repositories/listing_publications.rs
use sqlx::PgPool;
use uuid::Uuid;

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