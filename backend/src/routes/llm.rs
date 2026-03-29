use std::convert::Infallible;
use std::sync::atomic::AtomicU64;
use std::sync::Arc;

use axum::{
  body::Body,
  http::{header, StatusCode},
  middleware,
  response::{IntoResponse, Response},
  routing::post,
  Json, Router,
};
use bytes::Bytes;
use futures_util::StreamExt;
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;

use crate::dto::llm::{LlmAgentsRequest, LlmAgentsResponse, LlmStreamLine};
use crate::error::{self, ApiError};
use crate::llm::config::load_registry;
use crate::llm::orchestrator::Orchestrator;
use crate::llm::types::{AgentRunConfig, ProviderId};
use crate::middleware as mw;

use super::state::AppState;

const MAX_AGENTS: usize = 50;

pub fn routes() -> Router<AppState> {
  Router::new()
    .route("/llm/agents", post(llm_agents))
    .route("/llm/agents/stream", post(llm_agents_stream))
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn llm_agents(
  Json(body): Json<LlmAgentsRequest>,
) -> Result<Json<LlmAgentsResponse>, ApiError> {
  if body.agents.is_empty() {
    return Err(error::bad_request("agents must not be empty"));
  }
  if body.agents.len() > MAX_AGENTS {
    return Err(error::bad_request(&format!("at most {MAX_AGENTS} agents per request")));
  }

  let registry = load_registry().map_err(|e| error::service_unavailable(e.as_str()))?;

  let run = body.run.unwrap_or(AgentRunConfig {
    default_provider: ProviderId::OpenAI,
  });

  let agents = Orchestrator::run(&registry, &run, body.agents).await;

  Ok(Json(LlmAgentsResponse { agents }))
}

async fn llm_agents_stream(
  Json(body): Json<LlmAgentsRequest>,
) -> Result<Response, ApiError> {
  if body.agents.is_empty() {
    return Err(error::bad_request("agents must not be empty"));
  }
  if body.agents.len() > MAX_AGENTS {
    return Err(error::bad_request(&format!("at most {MAX_AGENTS} agents per request")));
  }

  let registry = load_registry().map_err(|e| error::service_unavailable(e.as_str()))?;

  let run = body.run.unwrap_or(AgentRunConfig {
    default_provider: ProviderId::OpenAI,
  });

  let specs = body.agents;
  let (tx, rx) = mpsc::channel::<LlmStreamLine>(64);
  let seq = Arc::new(AtomicU64::new(0));

  tokio::spawn(async move {
    Orchestrator::run_streaming(&registry, &run, specs, tx, seq).await;
  });

  let stream = ReceiverStream::new(rx).map(|line| {
    let mut s = serde_json::to_string(&line).unwrap_or_else(|_| "{}".to_string());
    s.push('\n');
    Ok::<Bytes, Infallible>(Bytes::from(s))
  });

  Ok((
    StatusCode::OK,
    [(header::CONTENT_TYPE, "application/x-ndjson")],
    Body::from_stream(stream),
  )
    .into_response())
}
