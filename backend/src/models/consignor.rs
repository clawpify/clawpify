use chrono::{DateTime, Utc};
use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow, ToSchema)]
pub struct Consignor {
  pub id: Uuid,                              // id 
  pub org_id: String,                        // org id
  pub display_name: String,                  // display name
  pub email: Option<String>,                 // email
  pub phone_e164: Option<String>,            // phone e164
  pub notes: Option<String>,                 // notes
  pub default_payout_method: Option<String>, // default payout method
  pub created_at: DateTime<Utc>,             // created at
  pub updated_at: DateTime<Utc>,             // updated at
}