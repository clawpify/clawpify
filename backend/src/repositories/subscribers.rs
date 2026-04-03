use sqlx::PgPool;
use uuid::Uuid;

use crate::models::subscriber::Subscriber;

fn normalize_email(email: &str) -> String {
  email.trim().to_lowercase()
}

pub async fn create(pool: &PgPool, email: &str) -> Result<Subscriber, sqlx::Error> {
  sqlx::query_as::<_, Subscriber>(
    r#"INSERT INTO waitlist (email, ip_hash)
       VALUES ($1, 'test-repo-fingerprint')
       RETURNING id, email, created_at"#,
  )
  .bind(normalize_email(email))
  .fetch_one(pool)
  .await
}

pub async fn update(pool: &PgPool, id: Uuid, email: &str) -> Result<Option<Subscriber>, sqlx::Error> {
  sqlx::query_as::<_, Subscriber>(
    r#"UPDATE waitlist
       SET email = $2
       WHERE id = $1
       RETURNING id, email, created_at"#,
  )
  .bind(id)
  .bind(normalize_email(email))
  .fetch_optional(pool)
  .await
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, sqlx::Error> {
  let done = sqlx::query("DELETE FROM waitlist WHERE id = $1")
    .bind(id)
    .execute(pool)
    .await?;
  Ok(done.rows_affected() > 0)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[sqlx::test(migrations = "../migrations")]
  async fn create_update_delete_subscriber(pool: PgPool) {
    let created = create(&pool, "  User@Example.com ").await.expect("create subscriber");
    assert_eq!(created.email, "user@example.com");

    let updated = update(&pool, created.id, "new@example.com")
      .await
      .expect("update subscriber")
      .expect("subscriber exists");
    assert_eq!(updated.email, "new@example.com");

    let deleted = delete(&pool, created.id).await.expect("delete subscriber");
    assert!(deleted);

    let maybe = sqlx::query_scalar::<_, Uuid>("SELECT id FROM waitlist WHERE id = $1")
      .bind(created.id)
      .fetch_optional(&pool)
      .await
      .expect("query subscriber");
    assert!(maybe.is_none());
  }

  #[sqlx::test(migrations = "../migrations")]
  async fn duplicate_email_returns_unique_violation(pool: PgPool) {
    let _first = create(&pool, "duplicate@example.com")
      .await
      .expect("create first subscriber");

    let result = create(&pool, "DUPLICATE@example.com").await;
    assert!(result.is_err());
  }
}
