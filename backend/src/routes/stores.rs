use axum::{
  extract::{Path, Query},
  middleware,
  routing::get,
  Extension, Json, Router,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth;
use crate::dto::stores::{CreateStoreRequest, UpdateStoreRequest};
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::repositories::{pagination::Pagination, stores};

#[derive(Deserialize)]
struct ListStoresQuery {
  limit: Option<i64>,
  offset: Option<i64>,
}

pub fn routes() -> Router<()> {
  Router::new()
    .route("/stores", get(list_stores).post(create_store))
    .route(
      "/stores/:id",
      get(get_store).patch(update_store).delete(delete_store),
    )
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn list_stores(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Query(q): Query<ListStoresQuery>,
) -> Result<Json<Vec<crate::models::store::Store>>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let page = Pagination::new(q.limit, q.offset);
  let rows = stores::list_by_org(&pool, &org_id, page).await.map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn create_store(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Json(body): Json<CreateStoreRequest>,
) -> Result<Json<crate::models::store::Store>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let row = stores::create(&pool, &org_id, body).await.map_err(error::db_error)?;
  Ok(Json(row))
}

async fn get_store(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Path(id): Path<Uuid>,
) -> Result<Json<crate::models::store::Store>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let row = stores::get_by_id(&pool, &org_id, id)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found("Store not found"))?;
  Ok(Json(row))
}

async fn update_store(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Path(id): Path<Uuid>,
  Json(body): Json<UpdateStoreRequest>,
) -> Result<Json<crate::models::store::Store>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let row = stores::update(&pool, &org_id, id, body)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found("Store not found"))?;
  Ok(Json(row))
}

async fn delete_store(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let deleted = stores::delete(&pool, &org_id, id).await.map_err(error::db_error)?;
  if !deleted {
    return Err(error::not_found("Store not found"));
  }
  Ok(Json(serde_json::json!({ "ok": true })))
}