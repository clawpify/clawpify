use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Contract {
  /* id: The ID of the contract. */
  pub id: Uuid,
  /* org_id: The ID of the organization. */
  pub org_id: String,
  /* consignor_id: The ID of the consignor. */
  pub consignor_id: Uuid,
  /* contract_type: The type of contract. */
  pub contract_type: String,
  /* status: The status of the contract. */
  pub status: String,
  /* start_at: The start date and time of the contract. */
  pub start_at: DateTime<Utc>, 
  /* end_at: The end date and time of the contract. */
  pub end_at: DateTime<Utc>,
  /* consignor_split_bps: The split percentage for the consignor. */
  pub consignor_split_bps: i32,
  /* store_split_bps: The split percentage for the store. */
  pub store_split_bps: i32,
  /* donation_price_cutoff_cents: The price cutoff for donations. */
  pub donation_price_cutoff_cents: i64,
  /* opt_out_under_threshold_donation: Whether the consignor has opted out of donations under the threshold. */
  pub opt_out_under_threshold_donation: bool,
  /* terms_version: The version of the terms and conditions. */
  pub terms_version: Option<String>,
  /* notes: The notes of the contract. */
  pub notes: Option<String>,
  /* created_at: The date and time the contract was created. */
  pub created_at: DateTime<Utc>,
  /* updated_at: The date and time the contract was last updated. */
  pub updated_at: DateTime<Utc>,
}