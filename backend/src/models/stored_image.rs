use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct StoredImage {
  pub id: Uuid,
  pub org_id: String,
  pub uploaded_by_user_id: String,
  pub storage_key: String,
  pub content_type: String,
  pub byte_size: i64,
  pub original_file_name: String,
  pub listing_id: Option<Uuid>,
  pub created_at: DateTime<Utc>,
}
