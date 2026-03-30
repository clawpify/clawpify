use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CreateConsignorRequest {
  /* display_name: The display name of the consignor. */
  pub display_name: String,
  /* email: The email of the consignor. */
  pub email: Option<String>,
  /* phone_e164: The phone number of the consignor in E.164 format. */
  pub phone_e164: Option<String>,
  /* notes: The notes of the consignor. */
  pub notes: Option<String>,
  /* default_payout_method: The default payout method of the consignor. */
  pub default_payout_method: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateConsignorRequest {
  /* display_name: The display name of the consignor. */
  pub display_name: Option<String>,
  /* email: The email of the consignor. */
  pub email: Option<String>,
  /* phone_e164: The phone number of the consignor in E.164 format. */
  pub phone_e164: Option<String>,
  /* notes: The notes of the consignor. */
  pub notes: Option<String>,
  /* default_payout_method: The default payout method of the consignor. */
  pub default_payout_method: Option<String>,
}

fn valid_payout_method(s: &str) -> bool {
  matches!(
    s,
    "cash" | "e_transfer" | "cheque" | "store_credit"
  )
}

pub fn validate_payout_method_opt(m: Option<&String>) -> Result<(), &'static str> {
  if let Some(s) = m {
    if !valid_payout_method(s.as_str()) {
      return Err("Invalid default_payout_method");
    }
  }
  Ok(())
}
