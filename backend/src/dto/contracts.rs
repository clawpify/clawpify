use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct ContractCreateRequest {
  pub consignor_id: Uuid,                          // consignor id
  #[serde(default = "default_contract_type")]
  pub contract_type: String,                       // contract type
  pub start_at: DateTime<Utc>,                     // start at
  pub end_at: DateTime<Utc>,                       // end at
  #[serde(default = "default_consignor_split")]
  pub consignor_split_bps: i32,                    // consignor split bps
  #[serde(default = "default_store_split")]
  pub store_split_bps: i32,                        // store split bps
  #[serde(default = "default_donation_cutoff")]
  pub donation_price_cutoff_cents: i64,            // donation price cutoff cents
  pub opt_out_under_threshold_donation: bool,      // opt out under threshold donation
  pub terms_version: Option<String>,               // terms version
  pub notes: Option<String>,                       // notes
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

#[derive(Debug, Deserialize, ToSchema)]
pub struct ContractPatchRequest {
  pub status: Option<String>,                         // status
  pub notes: Option<String>,                          // notes
  pub opt_out_under_threshold_donation: Option<bool>, // opt out under threshold donation
  pub end_at: Option<DateTime<Utc>>,                // end at
  pub terms_version: Option<String>,               // terms version
}

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct PayoutCreateRequest {
  pub amount_cents: i64,                           // amount cents
  pub method: String,                              // method
  pub payout_index: i16,                           // payout index
}

#[derive(Debug, Deserialize, Default, ToSchema)]
pub struct RunExpiryRequest {
  pub as_of: Option<DateTime<Utc>>,                // as of
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
