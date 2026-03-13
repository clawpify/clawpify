use axum::Extension;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth;
use crate::error::{self, ApiError};

#[derive(Serialize, sqlx::FromRow)]
pub struct Store {
  pub id: Uuid,
  pub org_id: String,
  pub platform: String,
  pub config: serde_json::Value,
  pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct CreateStoreRequest {
  pub base_url: String,
  #[serde(default)]
  pub platform: String,
}

pub async fn list_stores(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
) -> Result<axum::Json<Vec<Store>>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let rows = sqlx::query_as!(
    Store,
    r#"SELECT id, org_id, platform, config, created_at FROM stores WHERE org_id = $1"#,
    org_id
  )
  .fetch_all(&pool)
  .await
  .map_err(error::db_error)?;
  Ok(axum::Json(rows))
}

pub async fn create_store(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  axum::Json(body): axum::Json<CreateStoreRequest>,
) -> Result<axum::Json<Store>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let base_url = body.base_url.trim_end_matches('/').to_string();
  let platform = if body.platform.is_empty() {
    "url"
  } else {
    body.platform.as_str()
  };
  let config = serde_json::json!({ "baseUrl": base_url });

  sqlx::query!(
    "INSERT INTO organizations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
    org_id
  )
  .execute(&pool)
  .await
  .map_err(error::db_error)?;

  let row = sqlx::query_as!(
    Store,
    r#"INSERT INTO stores (org_id, platform, config) VALUES ($1, $2, $3)
           RETURNING id, org_id, platform, config, created_at"#,
    org_id,
    platform,
    config
  )
  .fetch_one(&pool)
  .await
  .map_err(error::db_error)?;
  Ok(axum::Json(row))
}
