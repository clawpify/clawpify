use sqlx::PgPool;
use uuid::Uuid;

use crate::dto::consignors::{CreateConsignorRequest, UpdateConsignorRequest};
use crate::models::consignor::Consignor;
use super::pagination::Pagination;

pub async fn list_by_org(
  pool: &PgPool,
  org_id: &str,
  page: Pagination,
) -> Result<Vec<Consignor>, sqlx::Error> {
  sqlx::query_as::<_, Consignor>(
    r#"SELECT id, org_id, display_name, email, phone_e164, notes, default_payout_method,
              created_at, updated_at
       FROM consignors
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

pub async fn get_by_id(
  pool: &PgPool,
  org_id: &str,
  id: Uuid,
) -> Result<Option<Consignor>, sqlx::Error> {
  sqlx::query_as::<_, Consignor>(
    r#"SELECT id, org_id, display_name, email, phone_e164, notes, default_payout_method,
              created_at, updated_at
       FROM consignors
       WHERE id = $1 AND org_id = $2"#,
  )
  .bind(id)
  .bind(org_id)
  .fetch_optional(pool)
  .await
}

pub async fn create(
  pool: &PgPool,
  org_id: &str,
  body: CreateConsignorRequest,
) -> Result<Consignor, sqlx::Error> {
  sqlx::query("INSERT INTO organizations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING")
    .bind(org_id)
    .execute(pool)
    .await?;

  sqlx::query_as::<_, Consignor>(
    r#"INSERT INTO consignors (
         org_id, display_name, email, phone_e164, notes, default_payout_method
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, org_id, display_name, email, phone_e164, notes, default_payout_method,
                 created_at, updated_at"#,
  )
  .bind(org_id)
  .bind(body.display_name.trim())
  .bind(body.email)
  .bind(body.phone_e164)
  .bind(body.notes)
  .bind(body.default_payout_method)
  .fetch_one(pool)
  .await
}

pub async fn update(
  pool: &PgPool,
  org_id: &str,
  id: Uuid,
  patch: UpdateConsignorRequest,
) -> Result<Option<Consignor>, sqlx::Error> {
  sqlx::query_as::<_, Consignor>(
    r#"UPDATE consignors SET
         display_name = COALESCE($3, display_name),
         email = COALESCE($4, email),
         phone_e164 = COALESCE($5, phone_e164),
         notes = COALESCE($6, notes),
         default_payout_method = COALESCE($7, default_payout_method),
         updated_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING id, org_id, display_name, email, phone_e164, notes, default_payout_method,
                 created_at, updated_at"#,
  )
  .bind(id)
  .bind(org_id)
  .bind(patch.display_name)
  .bind(patch.email)
  .bind(patch.phone_e164)
  .bind(patch.notes)
  .bind(patch.default_payout_method)
  .fetch_optional(pool)
  .await
}

pub async fn delete(pool: &PgPool, org_id: &str, id: Uuid) -> Result<bool, sqlx::Error> {
  let r = sqlx::query(r#"DELETE FROM consignors WHERE id = $1 AND org_id = $2"#)
    .bind(id)
    .bind(org_id)
    .execute(pool)
    .await?;
  Ok(r.rows_affected() > 0)
}

/// Any contract row blocks delete (`contracts.consignor_id` is ON DELETE RESTRICT).
pub async fn count_contracts_for_consignor(
  pool: &PgPool,
  org_id: &str,
  consignor_id: Uuid,
) -> Result<i64, sqlx::Error> {
  let n: i64 = sqlx::query_scalar(
    r#"SELECT COUNT(*)::bigint FROM contracts
       WHERE org_id = $1 AND consignor_id = $2"#,
  )
  .bind(org_id)
  .bind(consignor_id)
  .fetch_one(pool)
  .await?;
  Ok(n)
}
