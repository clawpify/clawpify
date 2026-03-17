use axum::{extract::Query, middleware, routing::get, Extension, Json, Router};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth;
use crate::error::{self, ApiError};
use crate::middleware as mw;

#[derive(Deserialize)]
struct ProductsQuery {
  pub store_id: Uuid,
}

pub fn routes() -> Router<()> {
  Router::new()
    .route("/ai-visibility/products", get(get_products))
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn get_products(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Query(query): Query<ProductsQuery>,
) -> Result<Json<Vec<serde_json::Value>>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;

  let store = sqlx::query(
    "SELECT id, config, platform FROM stores WHERE id = $1 AND org_id = $2",
  )
  .bind(query.store_id)
  .bind(&org_id)
  .fetch_optional(&pool)
  .await
  .map_err(error::db_error)?;

  let _store = store.ok_or_else(|| error::not_found("Store not found"))?;

  Ok(Json(vec![]))
}
