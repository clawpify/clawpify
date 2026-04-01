use sqlx::PgPool;

pub async fn insert(
  pool: &PgPool,
  org_id: &str,
  uploaded_by_user_id: &str,
  storage_key: &str,
  content_type: &str,
  byte_size: i64,
  original_file_name: &str,
) -> Result<(), sqlx::Error> {
  sqlx::query(
    r#"INSERT INTO stored_images (
          org_id,
          uploaded_by_user_id,
          storage_key,
          content_type,
          byte_size,
          original_file_name
        )
        VALUES ($1, $2, $3, $4, $5, $6)"#,
  )
  .bind(org_id)
  .bind(uploaded_by_user_id)
  .bind(storage_key)
  .bind(content_type)
  .bind(byte_size)
  .bind(original_file_name)
  .execute(pool)
  .await?;
  Ok(())
}

pub async fn delete_by_org_and_key(pool: &PgPool, org_id: &str, storage_key: &str) -> Result<u64, sqlx::Error> {
  let r = sqlx::query(r#"DELETE FROM stored_images WHERE org_id = $1 AND storage_key = $2"#)
    .bind(org_id)
    .bind(storage_key)
    .execute(pool)
    .await?;
  Ok(r.rows_affected())
}
