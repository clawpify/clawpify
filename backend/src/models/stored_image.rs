use chrono::{DateTime, Utc};
use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow, ToSchema)]
pub struct StoredImage {
  /* id: The ID of the stored image. */
  pub id: Uuid,
  /* org_id: The ID of the organization that the stored image belongs to. */
  pub org_id: String,
  /* uploaded_by_user_id: The ID of the user that uploaded the stored image. */
  pub uploaded_by_user_id: String,
  /* storage_key: The key used to store the stored image in the storage. */
  pub storage_key: String,
  /* content_type: The content type of the stored image. */
  pub content_type: String,
  /* byte_size: The size of the stored image in bytes. */
  pub byte_size: i64,
  /* original_file_name: The name of the original file that was uploaded. */
  pub original_file_name: String,
  /* listing_id: The ID of the listing that the stored image belongs to. */
  pub listing_id: Option<Uuid>,
  /* created_at: The timestamp when the stored image was created. */
  pub created_at: DateTime<Utc>,
}

/// Same shape as [`StoredImage`] plus a same-origin BFF URL for object bytes.
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ListingImageWithUrl {
  /* image: The stored image. */
  #[serde(flatten)]
  pub image: StoredImage,
  /* url: The URL of the stored image. */
  pub url: String,
}
