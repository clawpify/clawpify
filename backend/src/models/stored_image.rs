use chrono::{DateTime, Utc};
use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow, ToSchema)]
pub struct StoredImage {
  pub id: Uuid,                    // id
  pub org_id: String,              // org id
  pub uploaded_by_user_id: String, // uploaded by user id
  pub storage_key: String,         // storage key
  pub content_type: String,        // content type
  pub byte_size: i64,              // byte size
  pub original_file_name: String,  // original file name
  pub listing_id: Option<Uuid>,    // listing id
  pub created_at: DateTime<Utc>,   // created at
}

/// Same shape as [`StoredImage`] plus a same-origin BFF URL for object bytes.
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ListingImageWithUrl {
  #[serde(flatten)]
  pub image: StoredImage, // image
  pub url: String, // url
}
