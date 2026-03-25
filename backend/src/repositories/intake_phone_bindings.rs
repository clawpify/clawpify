use sqlx::PgPool;
use uuid::Uuid;

use crate::dto::intake::PhoneBindingResponse;

pub async fn get_by_phone_e164(
  pool: &PgPool,
  phone_e164: &str,
) -> Result<Option<PhoneBindingResponse>, sqlx::Error> {
  sqlx::query_as::<_, PhoneBindingResponse>(
    r#"SELECT id, phone_e164, clerk_user_id, org_id, verified_at, created_at
       FROM intake_phone_bindings
       WHERE phone_e164 = $1"#,
  )
  .bind(phone_e164)
  .fetch_optional(pool)
  .await
}

pub async fn list_for_org(
  pool: &PgPool,
  org_id: &str,
) -> Result<Vec<PhoneBindingResponse>, sqlx::Error> {
  sqlx::query_as::<_, PhoneBindingResponse>(
    r#"SELECT id, phone_e164, clerk_user_id, org_id, verified_at, created_at
       FROM intake_phone_bindings
       WHERE org_id = $1
       ORDER BY created_at DESC"#,
  )
  .bind(org_id)
  .fetch_all(pool)
  .await
}

pub async fn upsert_for_user(
  pool: &PgPool,
  org_id: &str,
  clerk_user_id: &str,
  phone_e164: &str,
) -> Result<PhoneBindingResponse, sqlx::Error> {
  let row = sqlx::query_as::<_, PhoneBindingResponse>(
    r#"INSERT INTO intake_phone_bindings (phone_e164, clerk_user_id, org_id, verified_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (org_id, clerk_user_id) DO UPDATE
         SET phone_e164 = EXCLUDED.phone_e164,
             verified_at = NOW()
       RETURNING id, phone_e164, clerk_user_id, org_id, verified_at, created_at"#,
  )
  .bind(phone_e164)
  .bind(clerk_user_id)
  .bind(org_id)
  .fetch_one(pool)
  .await?;

  Ok(row)
}

pub async fn delete_for_user(
  pool: &PgPool,
  org_id: &str,
  clerk_user_id: &str,
) -> Result<bool, sqlx::Error> {
  let done = sqlx::query(
    r#"DELETE FROM intake_phone_bindings
       WHERE org_id = $1 AND clerk_user_id = $2"#,
  )
  .bind(org_id)
  .bind(clerk_user_id)
  .execute(pool)
  .await?;
  Ok(done.rows_affected() > 0)
}

/// Returns true if another binding already owns this phone (different user/org).
pub async fn phone_taken_by_other(
  pool: &PgPool,
  phone_e164: &str,
  org_id: &str,
  clerk_user_id: &str,
) -> Result<bool, sqlx::Error> {
  let found: Option<(Uuid,)> = sqlx::query_as(
    r#"SELECT id FROM intake_phone_bindings
       WHERE phone_e164 = $1
         AND NOT (org_id = $2 AND clerk_user_id = $3)
       LIMIT 1"#,
  )
  .bind(phone_e164)
  .bind(org_id)
  .bind(clerk_user_id)
  .fetch_optional(pool)
  .await?;
  Ok(found.is_some())
}

#[cfg(test)]
mod tests {
  use super::*;

  async fn ensure_org(pool: &PgPool, id: &str) {
    sqlx::query("INSERT INTO organizations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING")
      .bind(id)
      .execute(pool)
      .await
      .unwrap();
  }

  #[sqlx::test(migrations = "../migrations")]
  async fn upsert_phone_binding(pool: PgPool) {
    ensure_org(&pool, "org-intake-1").await;
    let row = upsert_for_user(&pool, "org-intake-1", "user_a", "+15550001111")
      .await
      .expect("upsert");
    assert_eq!(row.phone_e164, "+15550001111");

    let row2 = upsert_for_user(&pool, "org-intake-1", "user_a", "+15550002222")
      .await
      .expect("upsert2");
    assert_eq!(row2.phone_e164, "+15550002222");
    assert_eq!(row2.id, row.id);

    let got = get_by_phone_e164(&pool, "+15550002222")
      .await
      .expect("get")
      .expect("exists");
    assert_eq!(got.clerk_user_id, "user_a");
  }
}
