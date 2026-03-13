use axum::{extract::Query, Extension};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth;
use crate::error::{self, ApiError};

#[derive(Serialize)]
pub struct ProductExport {
  pub id: String,
  pub name: String,
  pub description: Option<String>,
  pub price: Option<String>,
  pub sku: Option<String>,
  pub url: Option<String>,
}

#[derive(Deserialize)]
pub struct ProductsQuery {
  pub store_id: Uuid,
}

/// Returns products for a store. MVP: returns empty array.
/// TODO: Fetch from Shopify Admin API (when OAuth added) or scrape store URL.
pub async fn get_products(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Query(query): Query<ProductsQuery>,
) -> Result<axum::Json<Vec<ProductExport>>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;

  let store = sqlx::query!(
    "SELECT id, config, platform FROM stores WHERE id = $1 AND org_id = $2",
    query.store_id,
    org_id
  )
  .fetch_optional(&pool)
  .await
  .map_err(error::db_error)?;

  let _store = store.ok_or_else(|| error::not_found("Store not found"))?;

  Ok(axum::Json(vec![]))
}
