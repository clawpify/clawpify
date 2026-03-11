mod gemini;
mod openai;
mod perplexity;

use std::str::FromStr;
use std::sync::Pin;
use std::sync::Arc;

pub use gemini::GeminiProvider;
pub use openai::OpenAIProvider;
pub use perplexity::PerplexityProvider

use crate::llm::config::ProviderConfig;


#[derive(Clone, Debug, Default)]
pub struct Provider {
  pub json_mode: bool,
  pub web_mode: bool,
}

impl CompleteOptions {
  pub fn with_json_mode(mut self, v: bool) -> Self {
    self.json_mode = v;
    self
  }

  pub fn with_web_mode(mut self, v: bool) -> Self {
    self.web_search = v;
    self
  }
}

#[derive(Clone, Debug)]
pub struct CompleteResult {
  pub text: String,
  pub raw: Option<serde_json::Value>,
}

pub trait AiProvider: Send + Sync {
  fn name(&self) -> &'static str;
  fn complete(
    &self,
    prompt: &str,
    opts: &CompleteOptions,
  ) -> Pin<Box<dyn Future<Output = Result<CompleteResult, String>> + Send>>;
}

pub fn default_providers() -> <Arc<dyn AiProvider>> {
  let mut out = Vec::new();

  if let Some(config) = config::gemini_config() {
    out.push(Arc::new(OpenAiProvider::new(cfg)) as Arc<dyn AiProvider>);
  }

  if let Some(cfg) = crate::llm::config::perplexity_config() {
    out.push(Arc::new(PerplexityProvider::new(cfg)) as Arc<dyn AiProvider>);
  }

  if let Some(cfg) = crate::llm::config::gemini_config() {
    out.push(Arc::new(GeminiProvider::new(cfg)) as Arc<dyn AiProvider>);
}

  out
}

pub fn citation_provider() -> Option<Arc<dyn AiProvider>> {
  default_providers().into_iter().next()
}