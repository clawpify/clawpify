use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct ContractCreateRequest {
  /* consignor_id: The ID of the consignor. */
  pub consignor_id: Uuid,
  /* contract_type: The type of contract. */
  #[serde(default = "default_contract_type")]
  pub contract_type: String,
  /* start_at: The start date and time of the contract. */
  pub start_at: DateTime<Utc>,
  /* end_at: The end date and time of the contract. */
  pub end_at: DateTime<Utc>,
  /* consignor_split_bps: The split percentage for the consignor. */
  #[serde(default = "default_consignor_split")]
  pub consignor_split_bps: i32,
  /* store_split_bps: The split percentage for the store. */
  #[serde(default = "default_store_split")]
  pub store_split_bps: i32,
  /* donation_price_cutoff_cents: The price cutoff for donations. */
  #[serde(default = "default_donation_cutoff")]
  pub donation_price_cutoff_cents: i64,
  /* opt_out_under_threshold_donation: Whether the consignor has opted out of donations under the threshold. */
  #[serde(default)]
  pub opt_out_under_threshold_donation: bool,
  /* terms_version: The version of the terms and conditions. */
  pub terms_version: Option<String>,
  /* notes: The notes of the contract. */
  pub notes: Option<String>,
}

fn default_contract_type() -> String {
  "pick_up".to_string()
}

fn default_consignor_split() -> i32 {
  4000
}

fn default_store_split() -> i32 {
  6000
}

fn default_donation_cutoff() -> i64 {
  5000
}

#[derive(Debug, Deserialize)]
pub struct ContractPatchRequest {
  /* status: The status of the contract. */
  pub status: Option<String>,
  /* notes: The notes of the contract. */
  pub notes: Option<String>,
  /* opt_out_under_threshold_donation: Whether the consignor has opted out of donations under the threshold. */
  pub opt_out_under_threshold_donation: Option<bool>,
  pub end_at: Option<DateTime<Utc>>,
  /* terms_version: The version of the terms and conditions. */
  pub terms_version: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PayoutCreateRequest {
  /* amount_cents: The amount of the payout in cents. */
  pub amount_cents: i64,
  /* method: The method of the payout. */
  pub method: String,
  /* payout_index: The index of the payout. */
  pub payout_index: i16,
}

#[derive(Debug, Deserialize, Default)]
pub struct RunExpiryRequest {
  /* as_of: The date and time to run the expiry rules as of. */
  pub as_of: Option<DateTime<Utc>>,
}

pub fn valid_contract_type(s: &str) -> bool {
  matches!(s, "pick_up" | "donate_on")
}

pub fn valid_contract_status(s: &str) -> bool {
  matches!(s, "active" | "closed" | "expired")
}

pub fn valid_payout_method(s: &str) -> bool {
  matches!(s, "cash" | "e_transfer" | "cheque" | "store_credit")
}
