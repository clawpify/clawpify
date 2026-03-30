use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow)]
pub struct AgentActivity {
  /* id: The ID of the agent activity. */
  pub id: Uuid,
  /* org_id: The ID of the organization. */
  pub org_id: String,
  /* store_id: The ID of the store. */
  pub store_id: Option<Uuid>,
  /* agent_name: The name of the agent. */
  pub agent_name: String,
  /* action_type: The type of action. */
  pub action_type: String,
  /* payload: The payload of the activity. */
  pub payload: Option<serde_json::Value>,
  /* created_at: The date and time the activity was created. */
  pub created_at: chrono::DateTime<chrono::Utc>,
}
