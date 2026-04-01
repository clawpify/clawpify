use sqlx::{Executor, PgPool, Postgres};
use uuid::Uuid;

use crate::models::stored_image::StoredImage;

pub async fn insert(
  pool: &PgPool,
  org_id: &str,
  uploaded_by_user_id: &str,
  storage_key: &str,
  content_type: &str,
  byte_size: i64,
  original_file_name: &str,
  listing_id: Option<Uuid>,
) -> Result<(), sqlx::Error> {
  sqlx::query(
    r#"INSERT INTO stored_images (
          org_id,
          uploaded_by_user_id,
          storage_key,
          content_type,
          byte_size,
          original_file_name,
          listing_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)"#,
  )
  .bind(org_id)
  .bind(uploaded_by_user_id)
  .bind(storage_key)
  .bind(content_type)
  .bind(byte_size)
  .bind(original_file_name)
  .bind(listing_id)
  .execute(pool)
  .await?;
  Ok(())
}

pub async fn list_for_listing(
  pool: &PgPool,
  org_id: &str,
  listing_id: Uuid,
) -> Result<Vec<StoredImage>, sqlx::Error> {
  sqlx::query_as::<_, StoredImage>(
    r#"SELECT id, org_id, uploaded_by_user_id, storage_key, content_type, byte_size,
              original_file_name, listing_id, created_at
       FROM stored_images
       WHERE org_id = $1 AND listing_id = $2
       ORDER BY created_at ASC"#,
  )
  .bind(org_id)
  .bind(listing_id)
  .fetch_all(pool)
  .await
}

/// Sets `listing_id` when row is unattached or already on this listing. Returns true if one row updated.
pub async fn attach_to_listing<'e, E>(
  executor: E,
  org_id: &str,
  storage_key: &str,
  listing_id: Uuid,
) -> Result<bool, sqlx::Error>
where
  E: Executor<'e, Database = Postgres>,
{
  let r = sqlx::query(
    r#"UPDATE stored_images SET listing_id = $3
       WHERE org_id = $1 AND storage_key = $2
         AND (listing_id IS NULL OR listing_id = $3)"#,
  )
  .bind(org_id)
  .bind(storage_key)
  .bind(listing_id)
  .execute(executor)
  .await?;
  Ok(r.rows_affected() == 1)
}

/// Clears `listing_id` when row belongs to this listing. Returns true if one row updated.
pub async fn detach_from_listing(
  pool: &PgPool,
  org_id: &str,
  storage_key: &str,
  listing_id: Uuid,
) -> Result<bool, sqlx::Error> {
  let r = sqlx::query(
    r#"UPDATE stored_images SET listing_id = NULL
       WHERE org_id = $1 AND storage_key = $2 AND listing_id = $3"#,
  )
  .bind(org_id)
  .bind(storage_key)
  .bind(listing_id)
  .execute(pool)
  .await?;
  Ok(r.rows_affected() == 1)
}

pub async fn delete_by_org_and_key(pool: &PgPool, org_id: &str, storage_key: &str) -> Result<u64, sqlx::Error> {
  let r = sqlx::query(r#"DELETE FROM stored_images WHERE org_id = $1 AND storage_key = $2"#)
    .bind(org_id)
    .bind(storage_key)
    .execute(pool)
    .await?;
  Ok(r.rows_affected())
}
