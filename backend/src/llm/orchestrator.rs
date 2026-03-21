use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;

use serde_json::json;
use tokio::sync::mpsc;
use tokio::task::JoinHandle;

use crate::dto::llm::LlmStreamLine;
use crate::llm::providers::ProviderRegistry;
use crate::llm::types::{AgentJobResult, AgentRunConfig, ProviderId, SubAgentSpec};

pub struct Orchestrator;

impl Orchestrator {
  pub async fn run(
    registry: &ProviderRegistry,
    run: &AgentRunConfig,
    specs: Vec<SubAgentSpec>,
  ) -> Vec<AgentJobResult> {
    let sort_keys: HashMap<String, (usize, usize)> = specs
      .iter()
      .enumerate()
      .map(|(i, s)| (s.id.clone(), (s.order.unwrap_or(i), i)))
      .collect();

    let registry = registry.clone();
    let default_provider = run.default_provider;

    let mut handles: Vec<JoinHandle<AgentJobResult>> = Vec::with_capacity(specs.len());

    for spec in specs {
      let registry = registry.clone();
      let provider_id = spec.provider.unwrap_or(default_provider);
      let provider_arc = registry.get(provider_id).cloned();

      handles.push(tokio::spawn(async move {
        Self::run_one(provider_id, provider_arc, spec).await
      }));
    }

    let mut out = Vec::with_capacity(handles.len());
    for h in handles {
      match h.await {
        Ok(row) => out.push(row),
        Err(e) => out.push(AgentJobResult {
          id: "join_error".to_string(),
          provider: default_provider,
          status: "error".to_string(),
          answer: None,
          sources: None,
          error: Some(format!("task join failed: {e}")),
          duration_ms: 0,
        }),
      }
    }

    out.sort_by_key(|r| sort_keys.get(&r.id).copied().unwrap_or((usize::MAX, usize::MAX)));

    out
  }

  pub async fn run_streaming(
    registry: &ProviderRegistry,
    run: &AgentRunConfig,
    specs: Vec<SubAgentSpec>,
    out_tx: mpsc::Sender<LlmStreamLine>,
    seq: Arc<AtomicU64>,
  ) {
    let registry = registry.clone();
    let default_provider = run.default_provider;

    let mut handles = Vec::new();
    for spec in specs {
      let registry = registry.clone();
      let out_tx = out_tx.clone();
      let seq = seq.clone();

      handles.push(tokio::spawn(async move {
        let agent_id = spec.id.clone();
        let provider_id = spec.provider.unwrap_or(default_provider);
        let provider_arc = registry.get(provider_id).cloned();

        let next_seq = || seq.fetch_add(1, Ordering::Relaxed);

        let _ = out_tx
          .send(LlmStreamLine {
            agent_id: agent_id.clone(),
            seq: Some(next_seq()),
            kind: "agent_start".into(),
            data: json!({ "provider": provider_id }),
          })
          .await;

        let Some(p) = provider_arc else {
          let _ = out_tx
            .send(LlmStreamLine {
              agent_id: agent_id.clone(),
              seq: Some(next_seq()),
              kind: "error".into(),
              data: json!({ "message": format!("provider {provider_id:?} not configured") }),
            })
            .await;
          let start = Instant::now();
          let _ = out_tx
            .send(LlmStreamLine {
              agent_id,
              seq: Some(next_seq()),
              kind: "agent_done".into(),
              data: serde_json::to_value(&AgentJobResult {
                id: spec.id,
                provider: provider_id,
                status: "error".into(),
                answer: None,
                sources: None,
                error: Some(format!("provider {provider_id:?} not configured")),
                duration_ms: start.elapsed().as_millis() as u64,
              })
              .unwrap_or_else(|_| json!({})),
            })
            .await;
          return;
        };

        let (ev_tx, mut ev_rx) = mpsc::channel::<serde_json::Value>(64);
        let spec_clone = spec.clone();
        let agent_id_fwd = agent_id.clone();
        let provider_task = p.complete_with_events(&spec_clone, ev_tx);
        let forward_task = async {
          while let Some(ev) = ev_rx.recv().await {
            let _ = out_tx
              .send(LlmStreamLine {
                agent_id: agent_id_fwd.clone(),
                seq: Some(next_seq()),
                kind: "openai".into(),
                data: ev,
              })
              .await;
          }
        };

        let start = Instant::now();
        let result = tokio::join!(provider_task, forward_task).0;

        let done = match result {
          Ok(c) => AgentJobResult {
            id: agent_id.clone(),
            provider: provider_id,
            status: "ok".into(),
            answer: Some(c.text),
            sources: Some(c.sources),
            error: None,
            duration_ms: start.elapsed().as_millis() as u64,
          },
          Err(e) => AgentJobResult {
            id: agent_id.clone(),
            provider: provider_id,
            status: "error".into(),
            answer: None,
            sources: None,
            error: Some(e),
            duration_ms: start.elapsed().as_millis() as u64,
          },
        };

        let _ = out_tx
          .send(LlmStreamLine {
            agent_id,
            seq: Some(next_seq()),
            kind: "agent_done".into(),
            data: serde_json::to_value(&done).unwrap_or_else(|_| json!({})),
          })
          .await;
      }));
    }

    drop(out_tx);
    for h in handles {
      let _ = h.await;
    }
  }

  async fn run_one(
    provider_id: ProviderId,
    provider_arc: Option<Arc<dyn crate::llm::providers::LlmProvider>>,
    spec: SubAgentSpec,
  ) -> AgentJobResult {
    let start = Instant::now();

    let Some(p) = provider_arc else {
      return AgentJobResult {
        id: spec.id,
        provider: provider_id,
        status: "error".to_string(),
        answer: None,
        sources: None,
        error: Some(format!("provider {provider_id:?} not configured")),
        duration_ms: start.elapsed().as_millis() as u64,
      };
    };

    match p.complete(&spec).await {
      Ok(c) => AgentJobResult {
        id: spec.id,
        provider: provider_id,
        status: "ok".to_string(),
        answer: Some(c.text),
        sources: Some(c.sources),
        error: None,
        duration_ms: start.elapsed().as_millis() as u64,
      },
      Err(e) => AgentJobResult {
        id: spec.id,
        provider: provider_id,
        status: "error".to_string(),
        answer: None,
        sources: None,
        error: Some(e),
        duration_ms: start.elapsed().as_millis() as u64,
      },
    }
  }
}
