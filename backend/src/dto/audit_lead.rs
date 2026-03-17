use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct AuditLeadRequest {
  pub name: String,
  pub organization: Option<String>,
  pub email: String,
  pub newsletter_opt_in: bool,
  pub interest: Option<String>,
}

#[derive(Serialize)]
pub struct AuditLeadResponse {
  pub ok: bool,
}
