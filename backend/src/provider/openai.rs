use super::{CompleteOptions, CompleteResult, AiProvider};
use crate::llm::config::ProviderConfig;
use std::future::Future;
use std::pin::Pin;

pub struct OpenAiProvider {
  api_key: String,
  model: String,
}

impl OpenAiProvider {
  pub fn new(cfg: ProviderConfig) -> Self {
    let model = cfg
      .model
      .or_else(|| std::env::var("OPENAI_CITATION_MODEL").ok())
      .unwrap_or_else(|| "gpt-5.1".to_string());

    Self {
      api_key: cfg.api_key,
      model,
    }
  }
}

impl AiProvider for OpenAiProvider {

  fn name(&self) -> &'static str {
    "openai"
  }

  fn complete(
    &self,
    prompt: &str,
    opts: &CompleteOptions,
  ) -> Pin<Box<dyn Future<Output = Result<CompleteResult, String>> + Send>> {

    let prompt = prompt.to_string();
    let opts = opts.clone();
    let api_key = self.api_key.clone();
    let model = self.model.clone();

    Box::pin(async move {
      
      if opts.web_search {
        let client = reqwest::Client::new();

        let body = crate::services::citation::openai::call_responses_api(
          &client, &api_key, &model, &prompt,
        )
        .await?;

        let text = extract_text_from_responses_api(&body)?;

        Ok(CompleteResult {
          text,
          raw: Some(body),
        })
      } else {

        let text = crate::services::citation::openai::call_chat(
          &api_key, &model, &prompt, opts.json_mode,
        )
        .await?;

        Ok(CompleteResult {
          text,
          raw: None,
        })
      }
    })
  }
}

fn extract_text_from_responses_api(body: &serde_json::Value) -> Result<String, String> {

  body.get("output")
    .and_then(|o| o.as_array())
    .and_then(|arr| {
      arr.iter().find(|i| i.get("type").and_then(|t| t.as_str()) == Some("message"))
    })
    .and_then(|msg| msg.get("content").and_then(|c| c.as_array()))
    .and_then(|content| {
      content
        .iter()
        .find_map(|b| b.get("text").and_then(|t| t.as_str()))
    })
    .map(String::from)
    .ok_or_else(|| "Invalid OpenAI Responses API output".to_string())
}

