use serde::{Deserialize, Serialize};
use serde_json::Value;
use utoipa::ToSchema;

use crate::llm::types::{AgentJobResult, AgentRunConfig, SubAgentSpec};

#[derive(Debug, Deserialize, ToSchema)]
pub struct LlmAgentsRequest {
  #[serde(default)]
  pub run: Option<AgentRunConfig>, // run config
  pub agents: Vec<SubAgentSpec>,   // agents to run
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LlmAgentsResponse {
  pub agents: Vec<AgentJobResult>, // agents results
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LlmStreamLine {
  pub agent_id: String, // agent id
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seq: Option<u64>, // sequence number
  pub kind: String,     // kind of data
  pub data: Value,      // data
}
