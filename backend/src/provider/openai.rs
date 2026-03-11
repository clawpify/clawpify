use super::{CompleteOptions, CompleteResult};
use crate::llm::config::ProviderConfig;
use crate::llm::providers::AiProvider;
use std::future::Future;
use std::pin::Pin;

const OPENAI_RESPONSES_URL: &str = "https://api.openai.com/v1/responses";
const OPENAI_CHAT_URL: &str = "https://api.openai.com/v1/chat/completions";

pub struct OpenAiProvider {
  api_key: String,
  model: String,
}

impl OpenAiProvider {
  pub fn new(cfg: ProviderConfig) -> Self {
    let model = cfg
      .model
      .or_else(|| std::env::var("OPENAI_CITATION_MODEL").ok())
      .unwrap_or_else(|| "gpt-4o".to_string());

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
  ) -> Pin<Box<dyn Future<Output = Result<CompleteResult, String>> + Send>>> {

    let prompt = prompt.to_string();
    let opts = opts.clone();
    let api_key = self.api_key.clone();
    let model = self.model.clone();

    Box::pin(async move {
      
      if opts.web_search {
        let client = reqwest::Client::new();

        let body   = crate::audit::citation::openai::call_responses:api(
          &client, &api_key, &model, &prompt,
        )
        .await?;

        let text = extract_text_from_responses_api(&body)?;

        Ok(CompleteResult {
          text,
          raw: Some(body),
        })
      } else {

        let text = crate::audit::citation::openai::call_chat(
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

