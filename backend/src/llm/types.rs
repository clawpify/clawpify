use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProviderId {
  /// JSON uses `"openai"` (not `open_a_i`, which raw snake_case would produce).
  #[serde(rename = "openai")]
  OpenAI,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AgentRunConfig {
  pub default_provider: ProviderId,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WebSearchUserLocation {  
  #[serde(rename = "type")]
  pub location_type: String,
  /* country of the location */
  pub country: Option<String>,
  /* city of the location */
  pub city: Option<String>,
  /* region of the location */
  pub region: Option<String>,
  /* timezone of the location */
  pub timezone: Option<String>,
}


#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WebSearchToolConfig {
  /* allow web search to be used */
  pub allowed_domains: Option<Vec<String>>,
  /* user location for web search */
  pub user_location: Option<WebSearchUserLocation>,
  /* live vs cache-only for web search (OpenAI `external_web_access`) */
  pub external_web_access: Option<bool>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SubAgentSpec {
  /* agent name (for debugging) */
  pub id: String,
  pub prompt: String,
  pub provider: Option<ProviderId>,
  pub model: Option<String>,
  pub web_search: bool,
  pub web_search_config: Option<WebSearchToolConfig>,
  pub include_web_search_sources: Option<bool>,
  /// When true, uses the streaming API and emits `tracing::debug!` events (`llm.openai.stream`).
  #[serde(default)]
  pub stream_debug_logs: Option<bool>,
  /// Stable ordering of results in the response (lower first). Defaults to request order.
  #[serde(default)]
  pub order: Option<usize>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AgentJobResult {
  pub id: String,
  pub provider: ProviderId,
  pub status: String,
  pub answer: Option<String>,
  pub sources: Option<Vec<String>>,
  pub error: Option<String>,
  pub duration_ms: u64,
}
