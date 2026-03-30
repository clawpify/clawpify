use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow)]
pub struct Consignor {
  /* id: The ID of the consignor. */
  pub id: Uuid,
  /* org_id: The ID of the organization. */
  pub org_id: String,
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
  /* created_at: The date and time the consignor was created. */
  pub created_at: DateTime<Utc>,
  /* updated_at: The date and time the consignor was last updated. */
  pub updated_at: DateTime<Utc>,
}