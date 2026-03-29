use chrono::{DateTime, Utc};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct ContractCreateRequest {
  pub consignor_id: Uuid,
  #[serde(default = "default_contract_type")]
  pub contract_type: String,
  pub start_at: DateTime<Utc>,
  pub end_at: DateTime<Utc>,
  #[serde(default = "default_consignor_split")]
  pub consignor_split_bps: i32,
  #[serde(default = "default_store_split")]
  pub store_split_bps: i32,
  #[serde(default = "default_donation_cutoff")]
  pub donation_price_cutoff_cents: i64,
  #[serde(default)]
  pub opt_out_under_threshold_donation: bool,
  pub terms_version: Option<String>,
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
  pub status: Option<String>,
  pub notes: Option<String>,
  pub opt_out_under_threshold_donation: Option<bool>,
  pub end_at: Option<DateTime<Utc>>,
  pub terms_version: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PayoutCreateRequest {
  pub amount_cents: i64,
  pub method: String,
  pub payout_index: i16,
}

#[derive(Debug, Deserialize, Default)]
pub struct RunExpiryRequest {
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
