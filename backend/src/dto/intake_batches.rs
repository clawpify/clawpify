use chrono::{DateTime, Utc};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct IntakeBatchCreateRequest {
  /* box_count: The number of boxes in the batch. */
  pub box_count: i32,
  /* consignor_id: The ID of the consignor. */
  pub consignor_id: Option<Uuid>,
  /* notes: The notes of the batch. */
  pub notes: Option<String>,
  /* arrived_at: The date and time the batch arrived. */
  pub arrived_at: Option<DateTime<Utc>>,
}
