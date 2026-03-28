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
use crate::dto::listings::{CreateListingRequest, UpdateListingRequest};
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::models::consignment_listing::ConsignmentListing;
use crate::repositories::{listings, pagination::Pagination};

#[derive(Deserialize)]
struct ListListingsQuery {
  status: Option<String>,
  limit: Option<i64>,
  offset: Option<i64>,
}

pub fn routes() -> Router {
  Router::new()
    .route("/listings", get(list_listings).post(create_listing))
    .route(
      "/listings/:id",
      get(get_listing)
        .patch(update_listing)
        .delete(delete_listing),
    )
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn list_listings(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Query(q): Query<ListListingsQuery>,
) -> Result<Json<Vec<ConsignmentListing>>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let page = Pagination::new(q.limit, q.offset);
  let status = q.status.as_deref();
  let rows = listings::list_by_org(&pool, &org_id, status, page)
    .await
    .map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn create_listing(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Json(body): Json<CreateListingRequest>,
) -> Result<Json<ConsignmentListing>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let uid = auth::get_user_id(&headers)?;
  let row = listings::create(&pool, &org_id, Some(&uid), body)
    .await
    .map_err(error::db_error)?;
  Ok(Json(row))
}

async fn get_listing(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Path(id): Path<Uuid>,
) -> Result<Json<ConsignmentListing>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let row = listings::get_by_id(&pool, &org_id, id)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found("Listing not found"))?;
  Ok(Json(row))
}

async fn update_listing(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Path(id): Path<Uuid>,
  Json(body): Json<UpdateListingRequest>,
) -> Result<Json<ConsignmentListing>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let row = listings::update(&pool, &org_id, id, body)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found("Listing not found"))?;
  Ok(Json(row))
}

async fn delete_listing(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let deleted = listings::delete(&pool, &org_id, id)
    .await
    .map_err(error::db_error)?;
  if !deleted {
    return Err(error::not_found("Listing not found"));
  }
  Ok(Json(serde_json::json!({ "ok": true })))
}