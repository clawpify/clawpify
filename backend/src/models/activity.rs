use serde::Serialize;
use uuid::Uuid;

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
