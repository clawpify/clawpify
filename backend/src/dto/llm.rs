use serde::{Deserialize, Serialize};
use serde_json::Value;
use utoipa::ToSchema;

use crate::llm::types::{AgentJobResult, AgentRunConfig, SubAgentSpec};

#[derive(Debug, Deserialize, ToSchema)]
pub struct LlmAgentsRequest {
  /* run config */
  #[serde(default)]
  pub run: Option<AgentRunConfig>,
  /* agents to run */
  pub agents: Vec<SubAgentSpec>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LlmAgentsResponse {
  /* agents results */
  pub agents: Vec<AgentJobResult>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LlmStreamLine {
  /* agent id */
  pub agent_id: String,
  /* sequence number */
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seq: Option<u64>,
  /* kind of data */
  pub kind: String,
  /* data */
  pub data: Value,
}
