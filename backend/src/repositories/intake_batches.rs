use sqlx::{PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use crate::dto::intake_batches::IntakeBatchCreateRequest;
use crate::models::intake_batch::IntakeBatch;
use super::pagination::Pagination;

pub async fn list(
  pool: &PgPool,
  org_id: &str,
  consignor_id: Option<Uuid>,
  page: Pagination,
) -> Result<Vec<IntakeBatch>, sqlx::Error> {
  let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(
    r#"SELECT id, org_id, consignor_id, box_count, notes, arrived_at, created_at
       FROM intake_batches
       WHERE org_id ="#,
  );
  qb.push_bind(org_id);
  if let Some(cid) = consignor_id {
    qb.push(" AND consignor_id = ");
    qb.push_bind(cid);
  }
  qb.push(" ORDER BY arrived_at DESC LIMIT ");
  qb.push_bind(page.limit);
  qb.push(" OFFSET ");
  qb.push_bind(page.offset);
  qb.build_query_as::<IntakeBatch>().fetch_all(pool).await
}

pub async fn create(
  pool: &PgPool,
  org_id: &str,
  body: IntakeBatchCreateRequest,
) -> Result<IntakeBatch, sqlx::Error> {
  let arrived = body.arrived_at.unwrap_or_else(chrono::Utc::now);
  sqlx::query_as::<_, IntakeBatch>(
    r#"INSERT INTO intake_batches (org_id, consignor_id, box_count, notes, arrived_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, org_id, consignor_id, box_count, notes, arrived_at, created_at"#,
  )
  .bind(org_id)
  .bind(body.consignor_id)
  .bind(body.box_count)
  .bind(body.notes.as_deref())
  .bind(arrived)
  .fetch_one(pool)
  .await
}
