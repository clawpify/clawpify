//! Shared helpers for integration tests (`tests/*.rs` are separate crates).

use axum::body::Body;
use serde_json::Value;
use sqlx::PgPool;

pub async fn ensure_org(pool: &PgPool, org_id: &str) {
  sqlx::query("INSERT INTO organizations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING")
    .bind(org_id)
    .execute(pool)
    .await
    .expect("ensure org");
}

pub async fn json_from_body(body: Body) -> Value {
  let bytes = axum::body::to_bytes(body, usize::MAX)
    .await
    .expect("read body");
  if bytes.is_empty() {
    return Value::Null;
  }
  serde_json::from_slice(&bytes).expect("parse json body")
}
