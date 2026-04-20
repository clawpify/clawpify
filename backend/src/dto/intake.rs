use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow, ToSchema)]
pub struct PhoneBindingResponse {
  pub id: Uuid,                                       // id
  pub phone_e164: String,                             // phone e164
  pub clerk_user_id: String,                          // clerk user id
  pub org_id: String,                                 // org id
  pub verified_at: chrono::DateTime<chrono::Utc>,     // verified at
  pub created_at: chrono::DateTime<chrono::Utc>,      // created at
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpsertPhoneBindingRequest {
  pub phone_e164: String,                             // phone e164
}
