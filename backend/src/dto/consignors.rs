use serde::Deserialize;
use utoipa::ToSchema;

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateConsignorRequest {
  pub display_name: String,                  // display name
  pub email: Option<String>,                 // email
  pub phone_e164: Option<String>,            // phone e164
  pub notes: Option<String>,                 // notes
  pub default_payout_method: Option<String>, // default payout method
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateConsignorRequest {
  pub display_name: Option<String>,          // display name
  pub email: Option<String>,                 // email
  pub phone_e164: Option<String>,            // phone e164
  pub notes: Option<String>,                 // notes
  pub default_payout_method: Option<String>, // default payout method
}

fn valid_payout_method(s: &str) -> bool {
  matches!(s, "cash" | "e_transfer" | "cheque" | "store_credit")
}

pub fn validate_payout_method_opt(m: Option<&String>) -> Result<(), &'static str> {
  if let Some(s) = m {
    if !valid_payout_method(s.as_str()) {
      return Err("Invalid default_payout_method");
    }
  }
  Ok(())
}
