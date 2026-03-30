use serde_json::Value;
use sqlx::{Postgres, Transaction};

#[derive(Clone, Copy)]
pub struct IdempotencyScope<'a> {
  pub client_key: &'a str,
  pub operation: &'a str,
}

pub async fn lookup(
  tx: &mut Transaction<'_, Postgres>,
  org_id: &str,
  scope: IdempotencyScope<'_>,
) -> Result<Option<(String, i16, Value)>, sqlx::Error> {
  let row: Option<(String, i16, Value)> = sqlx::query_as(
    r#"SELECT request_hash, response_status, response_body
       FROM api_idempotency
       WHERE org_id = $1 AND idempotency_key = $2 AND operation = $3"#,
  )
  .bind(org_id)
  .bind(scope.client_key)
  .bind(scope.operation)
  .fetch_optional(&mut **tx)
  .await?;
  Ok(row)
}

pub async fn store(
  tx: &mut Transaction<'_, Postgres>,
  org_id: &str,
  scope: IdempotencyScope<'_>,
  request_hash: &str,
  response_status: u16,
  response_body: &Value,
) -> Result<(), sqlx::Error> {
  let status_i = i16::try_from(response_status).unwrap_or(500);
  sqlx::query(
    r#"INSERT INTO api_idempotency
         (org_id, idempotency_key, operation, request_hash, response_status, response_body)
       VALUES ($1, $2, $3, $4, $5, $6)"#,
  )
  .bind(org_id)
  .bind(scope.client_key)
  .bind(scope.operation)
  .bind(request_hash)
  .bind(status_i)
  .bind(response_body)
  .execute(&mut **tx)
  .await?;
  Ok(())
}

pub async fn advisory_lock(
  tx: &mut Transaction<'_, Postgres>,
  lock_bits: i64,
) -> Result<(), sqlx::Error> {
  sqlx::query("SELECT pg_advisory_xact_lock($1)")
    .bind(lock_bits)
    .execute(&mut **tx)
    .await?;
  Ok(())
}

/// Derives a 64-bit lock key from org + client idempotency key + operation name.
pub fn advisory_key_bits(org_id: &str, client_key: &str, operation: &str) -> i64 {
  use std::collections::hash_map::DefaultHasher;
  use std::hash::{Hash, Hasher};
  let mut h = DefaultHasher::new();
  org_id.hash(&mut h);
  client_key.hash(&mut h);
  operation.hash(&mut h);
  h.finish() as i64
}
