use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct LogActivityRequest {
  pub store_id: Option<Uuid>,
  pub agent_name: String,
  pub action_type: String,
  pub payload: Option<serde_json::Value>,
}
