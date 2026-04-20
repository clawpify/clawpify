use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Deserialize, ToSchema)]
pub struct LogActivityRequest {
  pub store_id: Option<Uuid>,             // store id
  pub agent_name: String,                 // agent name 
  pub action_type: String,                // action type
  pub payload: Option<serde_json::Value>, // payload
}
