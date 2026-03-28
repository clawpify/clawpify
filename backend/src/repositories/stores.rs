use sqlx::PgPool;
use uuid::Uuid;

use crate::dto::stores::{CreateStoreRequest, UpdateStoreRequest};
use crate::models::store::Store;
use super::pagination::Pagination;

pub async fn list_by_org(
  pool: &PgPool,
  org_id: &str,
  page: Pagination,
) -> Result<Vec<Store>, sqlx::Error> {
  sqlx::query_as::<_, Store>(
    r#"SELECT id, org_id, platform, config, created_at
       FROM stores
       WHERE org_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3"#,
  )
  .bind(org_id)
  .bind(page.limit)
  .bind(page.offset)
  .fetch_all(pool)
  .await
}

pub async fn create(
  pool: &PgPool,
  org_id: &str,
  body: CreateStoreRequest,
) -> Result<Store, sqlx::Error> {
  let base_url = body.base_url.trim_end_matches('/').to_string();

  let platform = if body.platform.is_empty() {
    "url".to_string()
  } else {
    body.platform
  };

  let config = serde_json::json!({ "baseUrl": base_url });

  sqlx::query("INSERT INTO organizations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING")
  .bind(org_id)
  .execute(pool)
  .await?;

  sqlx::query_as::<_, Store>(
    r#"INSERT INTO stores (org_id, platform, config)
       VALUES ($1, $2, $3)
       RETURNING id, org_id, platform, config, created_at"#,
  )
  .bind(org_id)
  .bind(&platform)
  .bind(config)
  .fetch_one(pool)
  .await
}

pub async fn get_by_id(
  pool: &PgPool,
  org_id: &str,
  id: Uuid,
) -> Result<Option<Store>, sqlx::Error> {
  sqlx::query_as::<_, Store>(
    r#"SELECT id, org_id, platform, config, created_at
       FROM stores
       WHERE id = $1 AND org_id = $2"#,
  )
  .bind(id)
  .bind(org_id)
  .fetch_optional(pool)
  .await
}

pub async fn update(
  pool: &PgPool,
  org_id: &str,
  id: Uuid,
  patch: UpdateStoreRequest,
) -> Result<Option<Store>, sqlx::Error> {

  let platform = patch.platform.map(|p| p.trim().to_string()).filter(|p| !p.is_empty());
  let base_url = patch.base_url.map(|u| u.trim_end_matches('/').to_string());

  let row = sqlx::query_as::<_, Store>(
    r#"UPDATE stores
      SET platform = COALESCE($3, platform),
          config = CASE
            WHEN $4::text IS NULL THEN config
            ELSE jsonb_set(config, '{baseUrl}', to_jsonb($4::text), true)
          END
      WHERE id = $1 AND org_id = $2
      RETURNING id, org_id, platform, config, created_at"#,
  )
  .bind(id)
  .bind(org_id)
  .bind(platform)
  .bind(base_url)
  .fetch_optional(pool)
  .await?;

  Ok(row)
}

pub async fn delete(
  pool: &PgPool,
  org_id: &str,
  id: Uuid,
) -> Result<bool, sqlx::Error> {
  let done = sqlx::query(
    r#"DELETE FROM stores WHERE id = $1 AND org_id = $2"#,
  )
  .bind(id)
  .bind(org_id)
  .execute(pool)
  .await?;
  Ok(done.rows_affected() > 0)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[sqlx::test(migrations = "../migrations")]
  async fn create_update_delete_store(pool: PgPool) {
    let created = create(
      &pool,
      "org-store-1",
      CreateStoreRequest {
        base_url: "https://example.com/".to_string(),
        platform: "".to_string(),
      },
    )
    .await
    .expect("create store");

    assert_eq!(created.org_id, "org-store-1");
    assert_eq!(created.platform, "url");
    assert_eq!(created.config["baseUrl"], serde_json::json!("https://example.com"));

    let updated = update(
      &pool,
      "org-store-1",
      created.id,
      UpdateStoreRequest {
        base_url: Some("https://new.example.com/".to_string()),
        platform: Some("url".to_string()),
      },
    )
    .await
    .expect("update store")
    .expect("store exists");

    assert_eq!(updated.platform, "url");
    assert_eq!(
      updated.config["baseUrl"],
      serde_json::json!("https://new.example.com")
    );

    let deleted = delete(&pool, "org-store-1", created.id).await.expect("delete store");
    assert!(deleted);

    let maybe = get_by_id(&pool, "org-store-1", created.id)
      .await
      .expect("get store");
    assert!(maybe.is_none());
  }

  #[sqlx::test(migrations = "../migrations")]
  async fn wrong_org_cannot_update_or_delete_store(pool: PgPool) {
    let created = create(
      &pool,
      "org-store-right",
      CreateStoreRequest {
        base_url: "https://example.com".to_string(),
        platform: "url".to_string(),
      },
    )
    .await
    .expect("create store");

    let updated = update(
      &pool,
      "org-store-wrong",
      created.id,
      UpdateStoreRequest {
        base_url: Some("https://hijack.example.com".to_string()),
        platform: Some("url".to_string()),
      },
    )
    .await
    .expect("update call");
    assert!(updated.is_none());

    let deleted = delete(&pool, "org-store-wrong", created.id).await.expect("delete call");
    assert!(!deleted);
  }
}
