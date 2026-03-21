use serde_json::{Map, Value};
use sqlx::PgPool;
use uuid::Uuid;

use crate::dto::llm::{
  CitationAnalyzeResponse, CitationItem, CreateCitationRunRequest, ListCitationRunsQuery,
  UpdateCitationRunRequest,
};
use crate::models::activity::AgentActivity;

pub const ACTION_TYPE: &str = "citation_geo_sentiment";
const DEFAULT_AGENT_NAME: &str = "citation-analyzer";

pub async fn create(
  pool: &PgPool,
  org_id: &str,
  body: CreateCitationRunRequest,
) -> Result<AgentActivity, sqlx::Error> {
  let CreateCitationRunRequest {
    store_id,
    agent_name,
    citations,
    analysis,
    payload,
  } = body;

  let agent_name = agent_name
    .unwrap_or_else(|| DEFAULT_AGENT_NAME.to_string())
    .trim()
    .to_string();
  let payload = build_create_payload(payload, citations, analysis);

  sqlx::query_as::<_, AgentActivity>(
    r#"INSERT INTO agent_activity (org_id, store_id, agent_name, action_type, payload)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, org_id, store_id, agent_name, action_type, payload, created_at"#,
  )
  .bind(org_id)
  .bind(store_id)
  .bind(if agent_name.is_empty() {
    DEFAULT_AGENT_NAME
  } else {
    &agent_name
  })
  .bind(ACTION_TYPE)
  .bind(payload)
  .fetch_one(pool)
  .await
}

pub async fn get(pool: &PgPool, org_id: &str, id: Uuid) -> Result<Option<AgentActivity>, sqlx::Error> {
  sqlx::query_as::<_, AgentActivity>(
    r#"SELECT id, org_id, store_id, agent_name, action_type, payload, created_at
       FROM agent_activity
       WHERE id = $1 AND org_id = $2 AND action_type = $3"#,
  )
  .bind(id)
  .bind(org_id)
  .bind(ACTION_TYPE)
  .fetch_optional(pool)
  .await
}

pub async fn list(
  pool: &PgPool,
  org_id: &str,
  q: ListCitationRunsQuery,
) -> Result<Vec<AgentActivity>, sqlx::Error> {
  let limit = q.limit.unwrap_or(50).clamp(1, 200);

  sqlx::query_as::<_, AgentActivity>(
    r#"SELECT id, org_id, store_id, agent_name, action_type, payload, created_at
       FROM agent_activity
       WHERE org_id = $1
         AND action_type = $2
         AND ($3::uuid IS NULL OR store_id = $3)
         AND ($4::timestamptz IS NULL OR created_at >= $4)
         AND ($5::timestamptz IS NULL OR created_at <= $5)
       ORDER BY created_at DESC
       LIMIT $6"#,
  )
  .bind(org_id)
  .bind(ACTION_TYPE)
  .bind(q.store_id)
  .bind(q.created_after)
  .bind(q.created_before)
  .bind(limit)
  .fetch_all(pool)
  .await
}

pub async fn update(
  pool: &PgPool,
  org_id: &str,
  id: Uuid,
  body: UpdateCitationRunRequest,
) -> Result<Option<AgentActivity>, sqlx::Error> {
  let existing = get(pool, org_id, id).await?;
  let Some(existing_row) = existing else {
    return Ok(None);
  };

  let agent_name = body
    .agent_name
    .unwrap_or(existing_row.agent_name.clone())
    .trim()
    .to_string();
  let payload = merge_json(existing_row.payload, body.payload);

  let updated = sqlx::query_as::<_, AgentActivity>(
    r#"UPDATE agent_activity
       SET agent_name = $1, payload = $2
       WHERE id = $3 AND org_id = $4 AND action_type = $5
       RETURNING id, org_id, store_id, agent_name, action_type, payload, created_at"#,
  )
  .bind(if agent_name.is_empty() {
    DEFAULT_AGENT_NAME
  } else {
    &agent_name
  })
  .bind(payload)
  .bind(id)
  .bind(org_id)
  .bind(ACTION_TYPE)
  .fetch_one(pool)
  .await?;

  Ok(Some(updated))
}

pub async fn delete(pool: &PgPool, org_id: &str, id: Uuid) -> Result<bool, sqlx::Error> {
  let done = sqlx::query(
    r#"DELETE FROM agent_activity
       WHERE id = $1 AND org_id = $2 AND action_type = $3"#,
  )
  .bind(id)
  .bind(org_id)
  .bind(ACTION_TYPE)
  .execute(pool)
  .await?;

  Ok(done.rows_affected() > 0)
}

fn build_create_payload(
  payload: Option<Value>,
  citations: Option<Vec<CitationItem>>,
  analysis: Option<CitationAnalyzeResponse>,
) -> Option<Value> {
  let mut base = payload.unwrap_or(Value::Object(Map::new()));
  if !base.is_object() {
    base = Value::Object(Map::new());
  }

  if let Some(obj) = base.as_object_mut() {
    if let Some(c) = citations {
      obj.insert("citations".to_string(), serde_json::to_value(c).unwrap_or(Value::Array(vec![])));
    }
    if let Some(a) = analysis {
      obj.insert("analysis".to_string(), serde_json::to_value(&a).unwrap_or(Value::Null));
      obj.insert("provider".to_string(), Value::String(a.provider));
      obj.insert("model".to_string(), Value::String(a.model));
    }
  }

  Some(base)
}

fn merge_json(existing: Option<Value>, patch: Option<Value>) -> Option<Value> {
  match (existing, patch) {
    (None, None) => None,
    (Some(v), None) => Some(v),
    (None, Some(v)) => Some(v),
    (Some(Value::Object(mut a)), Some(Value::Object(b))) => {
      for (k, v) in b {
        a.insert(k, v);
      }
      Some(Value::Object(a))
    }
    (_, Some(v)) => Some(v),
  }
}
