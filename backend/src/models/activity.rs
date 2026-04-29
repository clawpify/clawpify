use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow, ToSchema)]
pub struct AgentActivity {
  pub id: Uuid,                                  // id
  pub org_id: String,                            // org id
  pub store_id: Option<Uuid>,                    // store id
  pub agent_name: String,                        // agent name
  pub action_type: String,                       // action type
  pub payload: Option<serde_json::Value>,        // payload
  pub created_at: chrono::DateTime<chrono::Utc>, // created at
}
