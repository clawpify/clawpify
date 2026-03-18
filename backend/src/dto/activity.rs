use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct LogActivityRequest {
  /* store ID */
  pub store_id: Option<Uuid>,
  /* agent name */
  pub agent_name: String,
  /* action type */
  pub action_type: String,
  /* payload */
  pub payload: Option<serde_json::Value>,
}
