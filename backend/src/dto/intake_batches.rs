use chrono::{DateTime, Utc};
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Deserialize, ToSchema)]
pub struct IntakeBatchCreateRequest {
  pub box_count: i32,                    // box count
  pub consignor_id: Option<Uuid>,        // consignor id
  pub notes: Option<String>,             // notes
  pub arrived_at: Option<DateTime<Utc>>, // arrived at
}
