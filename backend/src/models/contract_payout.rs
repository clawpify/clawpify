use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct ContractPayout {
  /* id: The ID of the contract payout. */
  pub id: Uuid,
  /* org_id: The ID of the organization. */
  pub org_id: String,
  /* contract_id: The ID of the contract. */
  pub contract_id: Uuid,
  /* amount_cents: The amount of the payout in cents. */
  pub amount_cents: i64,
  /* method: The method of the payout. */
  pub method: String,
  /* payout_index: The index of the payout. */
  pub payout_index: i16,
  /* created_at: The date and time the payout was created. */
  pub created_at: DateTime<Utc>,
}