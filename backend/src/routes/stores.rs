use axum::{middleware, routing::get, Extension, Json, Router};
use sqlx::PgPool;

use crate::auth;
use crate::dto::stores::CreateStoreRequest;
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::models::store::Store;

pub fn routes() -> Router<()> {
  Router::new()
    .route("/stores", get(list_stores).post(create_store))
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn list_stores(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
) -> Result<Json<Vec<Store>>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let rows = sqlx::query_as::<_, Store>(
    r#"SELECT id, org_id, platform, config, created_at FROM stores WHERE org_id = $1"#,
  )
  .bind(&org_id)
  .fetch_all(&pool)
  .await
  .map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn create_store(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Json(body): Json<CreateStoreRequest>,
) -> Result<Json<Store>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let base_url = body.base_url.trim_end_matches('/').to_string();
  let platform = if body.platform.is_empty() {
    "url".to_string()
  } else {
    body.platform
  };
  let config = serde_json::json!({ "baseUrl": base_url });

  sqlx::query(
    "INSERT INTO organizations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
  )
  .bind(&org_id)
  .execute(&pool)
  .await
  .map_err(error::db_error)?;

  let row = sqlx::query_as::<_, Store>(
    r#"INSERT INTO stores (org_id, platform, config) VALUES ($1, $2, $3)
       RETURNING id, org_id, platform, config, created_at"#,
  )
  .bind(&org_id)
  .bind(&platform)
  .bind(&config)
  .fetch_one(&pool)
  .await
  .map_err(error::db_error)?;
  Ok(Json(row))
}
