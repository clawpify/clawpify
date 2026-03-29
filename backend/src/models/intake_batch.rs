use chrono::{DateTime, Utc}; 
use serde::Serialize; 
use uuid::Uuid;


#[derive(Serialize, sqlx::FromRow)]
pub struct IntakeBatch {
  /* id: The ID of the intake batch. */
  pub id: Uuid,
  /* org_id: The ID of the organization. */
  pub org_id: String,
  /* consignor_id: The ID of the consignor. */
  pub consignor_id: Option<Uuid>,
  /* box_count: The number of boxes in the batch. */
  pub box_count: i32,
  /* notes: The notes of the batch. */
  pub notes: Option<String>,
  /* arrived_at: The date and time the batch arrived. */
  pub arrived_at: DateTime<Utc>,
  /* created_at: The date and time the batch was created. */
  pub created_at: DateTime<Utc>,
}