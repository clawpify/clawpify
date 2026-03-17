use axum::{middleware, routing::get, Extension, Json, Router};
use sqlx::PgPool;

use crate::auth;
use crate::dto::activity::LogActivityRequest;
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::models::activity::AgentActivity;

pub fn routes() -> Router<()> {
  Router::new()
    .route("/agent-activity", get(list_activity).post(log_activity))
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn list_activity(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
) -> Result<Json<Vec<AgentActivity>>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let rows = sqlx::query_as::<_, AgentActivity>(
    r#"SELECT id, org_id, store_id, agent_name, action_type, payload, created_at
       FROM agent_activity
       WHERE org_id = $1
       ORDER BY created_at DESC
       LIMIT 50"#,
  )
  .bind(&org_id)
  .fetch_all(&pool)
  .await
  .map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn log_activity(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Json(body): Json<LogActivityRequest>,
) -> Result<Json<AgentActivity>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;

  if body.agent_name.is_empty() || body.action_type.is_empty() {
    return Err(error::bad_request("agent_name and action_type required"));
  }

  let row = sqlx::query_as::<_, AgentActivity>(
    r#"INSERT INTO agent_activity (org_id, store_id, agent_name, action_type, payload)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, org_id, store_id, agent_name, action_type, payload, created_at"#,
  )
  .bind(&org_id)
  .bind(body.store_id)
  .bind(&body.agent_name)
  .bind(&body.action_type)
  .bind(body.payload)
  .fetch_one(&pool)
  .await
  .map_err(error::db_error)?;
  Ok(Json(row))
}
