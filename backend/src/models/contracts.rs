use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct Contract {
  pub id: Uuid,                              // id  
  pub org_id: String,                        // org id
  pub consignor_id: Uuid,                     // consignor id
  pub contract_type: String,                  // contract type
  pub status: String,                         // status
  pub start_at: DateTime<Utc>,                // start at
  pub end_at: DateTime<Utc>,                  // end at
  pub consignor_split_bps: i32,               // consignor split bps
  pub store_split_bps: i32,                   // store split bps
  pub donation_price_cutoff_cents: i64,       // donation price cutoff cents
  pub opt_out_under_threshold_donation: bool, // opt out under threshold donation
  pub terms_version: Option<String>,          // terms version
  pub notes: Option<String>,                  // notes
  pub created_at: DateTime<Utc>,              // created at
  pub updated_at: DateTime<Utc>,              // updated at
}