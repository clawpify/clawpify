use chrono::{DateTime, Utc};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct IntakeBatchCreateRequest {
  pub box_count: i32,
  pub consignor_id: Option<Uuid>,
  pub notes: Option<String>,
  pub arrived_at: Option<DateTime<Utc>>,
}
