use chrono::{DateTime, Utc};
use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow, ToSchema)]
pub struct IntakeBatch {
  pub id: Uuid,                   // id
  pub org_id: String,             // org id
  pub consignor_id: Option<Uuid>, // consignor id
  pub box_count: i32,             // box count
  pub notes: Option<String>,      // notes
  pub arrived_at: DateTime<Utc>,  // arrived at
  pub created_at: DateTime<Utc>,  // created at
}
