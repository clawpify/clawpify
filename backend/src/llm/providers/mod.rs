use std::collections::HashMap;
use std::sync::Arc;

use async_trait::async_trait;
use tokio::sync::mpsc;

pub mod openai;

pub use crate::llm::types::ProviderId;
pub use openai::OpenAiProvider;

#[derive(Clone, Debug)]
pub struct ProviderCompletion {
  pub text: String,
  pub sources: Vec<String>,
}

#[async_trait]
pub trait LlmProvider: Send + Sync {
  async fn complete(&self, spec: &crate::llm::types::SubAgentSpec) -> Result<ProviderCompletion, String>;

  async fn complete_with_events(
    &self,
    spec: &crate::llm::types::SubAgentSpec,
    event_tx: mpsc::Sender<serde_json::Value>,
  ) -> Result<ProviderCompletion, String> {
    let _ = event_tx;
    self.complete(spec).await
  }
}

#[derive(Clone, Default)]
pub struct ProviderRegistry {
  pub inner: HashMap<ProviderId, Arc<dyn LlmProvider>>,
}

impl ProviderRegistry {
  pub fn insert(&mut self, id: ProviderId, p: Arc<dyn LlmProvider>) {
    self.inner.insert(id, p);
  }

  pub fn get(&self, id: ProviderId) -> Option<&Arc<dyn LlmProvider>> {
    self.inner.get(&id)
  }

  pub fn is_empty(&self) -> bool {
    self.inner.is_empty()
  }
}
