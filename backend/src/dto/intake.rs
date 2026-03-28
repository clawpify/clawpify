use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PhoneBindingResponse {
  /* id: The ID of the phone binding. */  
  pub id: Uuid,
  /* phone_e164: The phone number in E.164 format. */
  pub phone_e164: String,
  /* clerk_user_id: The ID of the clerk user. */
  pub clerk_user_id: String,
  /* org_id: The ID of the organization. */
  pub org_id: String,
  /* verified_at: The date and time the phone binding was verified. */
  pub verified_at: chrono::DateTime<chrono::Utc>,
  /* created_at: The date and time the phone binding was created. */
  pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertPhoneBindingRequest {
  /* phone_e164: The phone number in E.164 format. */
  pub phone_e164: String,
}
