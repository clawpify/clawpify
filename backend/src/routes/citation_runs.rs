use axum::{
  extract::{Path, Query},
  middleware,
  routing::get,
  Extension, Json, Router,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth;
use crate::dto::llm::{CreateCitationRunRequest, ListCitationRunsQuery, UpdateCitationRunRequest};
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::models::activity::AgentActivity;
use crate::services::citation_runs;

pub fn routes() -> Router<()> {
  Router::new()
    .route("/llm/citation-runs", get(list_runs).post(create_run))
    .route(
      "/llm/citation-runs/:id",
      get(get_run).patch(update_run).delete(delete_run),
    )
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn list_runs(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Query(query): Query<ListCitationRunsQuery>,
) -> Result<Json<Vec<AgentActivity>>, ApiError> {
  let org_id = auth::org_scope_for_activity(&headers)?;
  let rows = citation_runs::list(&pool, &org_id, query)
    .await
    .map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn create_run(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Json(body): Json<CreateCitationRunRequest>,
) -> Result<Json<AgentActivity>, ApiError> {

  let org_id = auth::org_scope_for_activity(&headers)?;
  let row = citation_runs::create(&pool, &org_id, body)
    .await
    .map_err(error::db_error)?;

  Ok(Json(row))
}

async fn get_run(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Path(id): Path<Uuid>,
) -> Result<Json<AgentActivity>, ApiError> {

  let org_id = auth::org_scope_for_activity(&headers)?;
  let row = citation_runs::get(&pool, &org_id, id)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found("Citation run not found"))?;
    
  Ok(Json(row))
}

async fn update_run(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Path(id): Path<Uuid>,
  Json(body): Json<UpdateCitationRunRequest>,
) -> Result<Json<AgentActivity>, ApiError> {
  let org_id = auth::org_scope_for_activity(&headers)?;
  let row = citation_runs::update(&pool, &org_id, id, body)
    .await
    .map_err(error::db_error)?
    .ok_or_else(|| error::not_found("Citation run not found"))?;
  Ok(Json(row))
}

async fn delete_run(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
  let org_id = auth::org_scope_for_activity(&headers)?;
  let deleted = citation_runs::delete(&pool, &org_id, id)
    .await
    .map_err(error::db_error)?;

  if !deleted {
    return Err(error::not_found("Citation run not found"));
  }

  Ok(Json(serde_json::json!({ "ok": true })))
}
