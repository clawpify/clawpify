use sqlx::PgPool;

use crate::models::organization::Organization;

pub async fn create(
  pool: &PgPool,
  id: &str,
  name: Option<String>,
  slug: Option<String>,
) -> Result<Organization, sqlx::Error> {
  sqlx::query_as::<_, Organization>(
    r#"INSERT INTO organizations (id, name, slug)
       VALUES ($1, $2, $3)
       RETURNING id, name, slug, created_at"#,
  )
  .bind(id)
  .bind(name)
  .bind(slug)
  .fetch_one(pool)
  .await
}

pub async fn update(
  pool: &PgPool,
  id: &str,
  name: Option<String>,
  slug: Option<String>,
) -> Result<Option<Organization>, sqlx::Error> {
  sqlx::query_as::<_, Organization>(
    r#"UPDATE organizations
       SET name = COALESCE($2, name),
           slug = COALESCE($3, slug)
       WHERE id = $1
       RETURNING id, name, slug, created_at"#,
  )
  .bind(id)
  .bind(name)
  .bind(slug)
  .fetch_optional(pool)
  .await
}

pub async fn delete(pool: &PgPool, id: &str) -> Result<bool, sqlx::Error> {
  let done = sqlx::query("DELETE FROM organizations WHERE id = $1")
    .bind(id)
    .execute(pool)
    .await?;
  Ok(done.rows_affected() > 0)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[sqlx::test(migrations = "../migrations")]
  async fn create_update_delete_organization(pool: PgPool) {
    let created = create(
      &pool,
      "org-test-1",
      Some("Acme".to_string()),
      Some("acme".to_string()),
    )
    .await
    .expect("create org");
    assert_eq!(created.id, "org-test-1");
    assert_eq!(created.name.as_deref(), Some("Acme"));
    assert_eq!(created.slug.as_deref(), Some("acme"));

    let updated = update(
      &pool,
      "org-test-1",
      Some("Acme Inc".to_string()),
      Some("acme-inc".to_string()),
    )
    .await
    .expect("update org")
    .expect("organization exists");
    assert_eq!(updated.name.as_deref(), Some("Acme Inc"));
    assert_eq!(updated.slug.as_deref(), Some("acme-inc"));

    let deleted = delete(&pool, "org-test-1").await.expect("delete org");
    assert!(deleted);

    let maybe = sqlx::query_scalar::<_, String>("SELECT id FROM organizations WHERE id = $1")
      .bind("org-test-1")
      .fetch_optional(&pool)
      .await
      .expect("query org");
    assert!(maybe.is_none());
  }

  #[sqlx::test(migrations = "../migrations")]
  async fn delete_organization_fails_when_stores_exist(pool: PgPool) {
    create(
      &pool,
      "org-with-store",
      Some("Has Store".to_string()),
      Some("has-store".to_string()),
    )
    .await
    .expect("create org");

    sqlx::query(
      r#"INSERT INTO stores (org_id, platform, config)
         VALUES ($1, 'url', '{"baseUrl":"https://example.com"}'::jsonb)"#,
    )
    .bind("org-with-store")
    .execute(&pool)
    .await
    .expect("create dependent store");

    let result = delete(&pool, "org-with-store").await;
    assert!(result.is_err());
  }
}
