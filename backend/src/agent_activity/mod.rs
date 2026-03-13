use axum::Extension;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth;
use crate::error::{self, ApiError};

#[derive(Serialize, sqlx::FromRow)]
pub struct AgentActivity {
  pub id: Uuid,
  pub org_id: String,
  pub store_id: Option<Uuid>,
  pub agent_name: String,
  pub action_type: String,
  pub payload: Option<serde_json::Value>,
  pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct LogActivityRequest {
  pub store_id: Option<Uuid>,
  pub agent_name: String,
  pub action_type: String,
  pub payload: Option<serde_json::Value>,
}

pub async fn list_activity(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
) -> Result<axum::Json<Vec<AgentActivity>>, ApiError> {
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
  Ok(axum::Json(rows))
}

pub async fn log_activity(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  axum::Json(body): axum::Json<LogActivityRequest>,
) -> Result<axum::Json<AgentActivity>, ApiError> {
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
  Ok(axum::Json(row))
}
