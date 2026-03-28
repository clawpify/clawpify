use std::sync::Arc;

use crate::llm::providers::{LlmProvider, OpenAiProvider, ProviderId, ProviderRegistry};

pub fn load_registry() -> Result<ProviderRegistry, String> {
  let mut registry = ProviderRegistry::default();

  if let Ok(key) = std::env::var("OPENAI_API_KEY") {
    let key = key.trim().to_string();
    if !key.is_empty() {
      let model =
        std::env::var("OPENAI_LLM_MODEL").unwrap_or_else(|_| "gpt-4o-mini".to_string());
      let p: Arc<dyn LlmProvider> = Arc::new(OpenAiProvider::new(key, model));
      registry.insert(ProviderId::OpenAI, p);
    }
  }

  if registry.is_empty() {
    return Err("No LLM providers configured (set OPENAI_API_KEY)".to_string());
  }

  Ok(registry)
}
