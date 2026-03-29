use axum::{extract::State, middleware, routing::get, Json, Router};

use super::extractors::ActivityOrgScope;
use super::state::AppState;
use crate::dto::activity::LogActivityRequest;
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::models::activity::AgentActivity;

pub fn routes() -> Router<AppState> {
  Router::new()
    .route("/agent-activity", get(list_activity).post(log_activity))
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn list_activity(
  State(state): State<AppState>,
  ActivityOrgScope(org_id): ActivityOrgScope,
) -> Result<Json<Vec<AgentActivity>>, ApiError> {
  let rows = sqlx::query_as::<_, AgentActivity>(
    r#"SELECT id, org_id, store_id, agent_name, action_type, payload, created_at
       FROM agent_activity
       WHERE org_id = $1
       ORDER BY created_at DESC
       LIMIT 50"#,
  )
  .bind(org_id.as_str())
  .fetch_all(&state.pool)
  .await
  .map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn log_activity(
  State(state): State<AppState>,
  ActivityOrgScope(org_id): ActivityOrgScope,
  Json(body): Json<LogActivityRequest>,
) -> Result<Json<AgentActivity>, ApiError> {
  if body.agent_name.is_empty() || body.action_type.is_empty() {
    return Err(error::bad_request("agent_name and action_type required"));
  }

  let row = sqlx::query_as::<_, AgentActivity>(
    r#"INSERT INTO agent_activity (org_id, store_id, agent_name, action_type, payload)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, org_id, store_id, agent_name, action_type, payload, created_at"#,
  )
  .bind(org_id.as_str())
  .bind(body.store_id)
  .bind(&body.agent_name)
  .bind(&body.action_type)
  .bind(body.payload)
  .fetch_one(&state.pool)
  .await
  .map_err(error::db_error)?;
  Ok(Json(row))
}
