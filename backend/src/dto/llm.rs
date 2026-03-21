use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::llm::types::{AgentJobResult, AgentRunConfig, SubAgentSpec};

#[derive(Debug, Deserialize)]
pub struct LlmAgentsRequest {
  /* run config */
  #[serde(default)]
  pub run: Option<AgentRunConfig>,
  /* agents to run */
  pub agents: Vec<SubAgentSpec>,
}

#[derive(Debug, Serialize)]
pub struct LlmAgentsResponse {
  /* agents results */
  pub agents: Vec<AgentJobResult>,
}

#[derive(Debug, Serialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CitationItem {
  /* url of the citation */
  pub url: String,
  /* snippet of the citation */
  #[serde(default)]
  pub snippet: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CitationAnalyzeRequest {
  /* citations to analyze */
  pub citations: Vec<CitationItem>,
  /* maximum number of citations to analyze */
  #[serde(default)]
  pub max_citations: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CitationAnalysisResult {
  /* url of the citation */
  pub url: String,
  /* sentiment score in 1..=100 */
  pub sentiment_score: u8,
  /* confidence in 1..=100 */
  pub confidence: u8,
  /* regions */
  #[serde(default)]
  pub regions: Vec<String>,
  /* unknown */
  #[serde(default)]
  pub unknown: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CitationAnalyzeResponse {
  /* provider */
  pub provider: String,
  /* model */
  pub model: String,
  /* results */
  pub results: Vec<CitationAnalysisResult>,
  /* error */
  #[serde(skip_serializing_if = "Option::is_none")]
  pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCitationRunRequest {
  /* store id */
  #[serde(default)]
  pub store_id: Option<Uuid>,
  /* agent name */
  #[serde(default)]
  pub agent_name: Option<String>,
  /* citations */
  #[serde(default)]
  pub citations: Option<Vec<CitationItem>>,
  /* analysis */
  #[serde(default)]
  pub analysis: Option<CitationAnalyzeResponse>,
  /* payload */
  #[serde(default)]
  pub payload: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCitationRunRequest {
  /* agent name */
  #[serde(default)]
  pub agent_name: Option<String>,
  /* payload */
  #[serde(default)]
  pub payload: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct ListCitationRunsQuery {
  /* store id */
  #[serde(default)]
  pub store_id: Option<Uuid>,
  /* created after */
  #[serde(default)]
  pub created_after: Option<DateTime<Utc>>,
  /* created before */
  #[serde(default)]
  pub created_before: Option<DateTime<Utc>>,
  /* limit */
  #[serde(default)]
  pub limit: Option<i64>,
}
