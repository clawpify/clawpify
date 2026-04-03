use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
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

/// Same shape as [`StoredImage`] plus a same-origin BFF URL for object bytes.
#[derive(Debug, Clone, Serialize)]
pub struct ListingImageWithUrl {
  #[serde(flatten)]
  pub image: StoredImage,
  pub url: String,
}
