use std::collections::HashMap;
use std::sync::Arc;

use super::providers::{AiProvider, CompleteOptions, CompleteResult};

pub async fn run_all_providers(
  providers: &[Arc<dyn AiProvider>],
  prompt: &str,
  opts: &CompleteOptions,
) -> HashMap<String, Result<CompleteResult, String>> {
    let mut handles = Vec::with_capacity(providers.len());
    for provider in providers {
      let provider = Arc::clone(provider);
      let prompt = prompt.to_string();
      let opts = opts.clone();
      handles.push(tokio::spawn(async move {
        let name = provider.name().to_string();
        let result = provider.complete(&prompt, &opts).await;
        (name, result)
      }));
    }

    let mut out = HashMap::new();
    for h in handles {
    if let Ok((name, result)) = h.await {
      out.insert(name, result);
    }
    }
  out
}

pub async fn run_single_provider(
  provider: &Arc<dyn AiProvider>,
  prompt: &str,
  opts: &CompleteOptions,
) -> Result<CompleteResult, String> {
  provider.complete(prompt, opts).await
}