use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct ContractPayout {
  pub id: Uuid,                             // id
  pub org_id: String,                       // org id
  pub contract_id: Uuid,                    // contract id
  pub amount_cents: i64,                    // amount cents
  pub method: String,                       // method
  pub payout_index: i16,                    // payout index
  pub created_at: DateTime<Utc>,            // created at
}