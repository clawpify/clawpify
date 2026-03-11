use super::{CompleteOptions, CompleteResult, AiProvider};
use crate::llm::config::ProviderConfig;
use std::future::Future;
use std::pin::Pin;

pub struct GeminiProvider {
  api_key: String,
  model: String,
}

impl GeminiProvider {
  pub fn new(cfg: ProviderConfig) -> Self {
    let model = cfg
      .model.unwrap_or_else(|| "gemini-2.0-flash".to_string()); 
    
    Self {
      api_key: cfg.api_key,
      model,
    }
  }
}

impl AiProvider for GeminiProvider {
  fn name(&self) -> &'static str {
    "gemini"
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
      let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
      );

      let mut contents = serde_json::json!({
        "contents": [{ "parts": [{ "text": prompt }] }]
      });

      if opts.web_search {
        contents["tools"] = serde_json::json!([{ "google_search": {}}]);
      }

      let res = reqwest::Client::new()
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&contents)
        .send()
        .await
        .map_err(|e| e.to_string())?;

      let status = res.status();
      let body: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;

      if !status.is_success() {
        let msg = body
          .get("error")
          .and_then(|e| e.get("message"))
          .and_then(|m| m.as_str())
          .unwrap_or("Gemini API error");
        return Err(msg.to_string());
      }

      let text = body
        .get("candidates")
        .and_then(|c| c.as_array())
        .and_then(|a| a.first())
        .and_then(|c| c.get("content"))
        .and_then(|c| c.get("parts"))
        .and_then(|p| p.as_array())
        .and_then(|a| a.first())
        .and_then(|p| p.get("text"))
        .and_then(|t| t.as_str())
        .map(String::from)
        .ok_or_else(|| "Invalid Gemini response".to_string())?;

      Ok(CompleteResult { text, raw: None })
    })
  }
}
