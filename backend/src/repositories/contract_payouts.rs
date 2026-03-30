use sqlx::{Executor, PgPool, Postgres};
use uuid::Uuid;

use crate::models::contract_payout::ContractPayout;

pub async fn list_for_contract(
  pool: &PgPool,
  org_id: &str,
  contract_id: Uuid,
) -> Result<Vec<ContractPayout>, sqlx::Error> {
  sqlx::query_as::<_, ContractPayout>(
    r#"SELECT id, org_id, contract_id, amount_cents, method, payout_index, created_at
       FROM contract_payouts
       WHERE org_id = $1 AND contract_id = $2
       ORDER BY payout_index"#,
  )
  .bind(org_id)
  .bind(contract_id)
  .fetch_all(pool)
  .await
}

pub async fn count_for_contract<'e, E>(
  executor: E,
  contract_id: Uuid,
) -> Result<i64, sqlx::Error>
where
  E: Executor<'e, Database = Postgres>,
{
  let n: i64 =
    sqlx::query_scalar(r#"SELECT COUNT(*)::bigint FROM contract_payouts WHERE contract_id = $1"#)
      .bind(contract_id)
      .fetch_one(executor)
      .await?;
  Ok(n)
}

pub async fn create<'e, E>(
  executor: E,
  org_id: &str,
  contract_id: Uuid,
  amount_cents: i64,
  method: &str,
  payout_index: i16,
) -> Result<ContractPayout, sqlx::Error>
where
  E: Executor<'e, Database = Postgres>,
{
  sqlx::query_as::<_, ContractPayout>(
    r#"INSERT INTO contract_payouts (org_id, contract_id, amount_cents, method, payout_index)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, org_id, contract_id, amount_cents, method, payout_index, created_at"#,
  )
  .bind(org_id)
  .bind(contract_id)
  .bind(amount_cents)
  .bind(method)
  .bind(payout_index)
  .fetch_one(executor)
  .await
}
