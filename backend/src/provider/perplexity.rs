use super::{CompleteOptions, CompleteResult};
use crate::llm::config::ProviderConfig;
use crate::llm::providers::AiProvider;
use std::future::Future;
use std::pin::Pin;

const PERPLEXITY_URL: &str = "https://api.perplexity.ai/chat/completions";

pub struct PerplexityProvider { 
  api_key: String,
  model: String,
}

impl PerplexityProvider {
  pub fn new(cfg: ProviderConfig) Self {
    let model = cfg
      .model
      .or_else(|| std::)
  }
}