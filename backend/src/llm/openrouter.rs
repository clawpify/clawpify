use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde_json::{json, Value};

use crate::http_client;

const OPENROUTER_URL: &str = "https://openrouter.ai/api/v1/chat/completions";

#[derive(Debug, Clone)]
pub struct OpenRouterClient {
  /* openrouter api key */
  api_key: String,
  /* default model to use */
  model: String,
  /* http referer */
  http_referer: Option<String>,
  /* title */
  title: Option<String>,
}

impl OpenRouterClient {
  pub fn from_env() -> Result<Self, String> {

    let api_key = std::env::var("OPENROUTER_API_KEY")
      .map_err(|_| "OPENROUTER_API_KEY is not set".to_string())?;

    if api_key.trim().is_empty() {
      return Err("OPENROUTER_API_KEY is empty".to_string());
    }

    let model =
      std::env::var("OPENROUTER_CITATION_MODEL").unwrap_or_else(|_| "minimax/minimax-m2.7".to_string());

    Ok(Self {
      api_key,
      model,
      http_referer: std::env::var("OPENROUTER_HTTP_REFERER").ok(),
      title: std::env::var("OPENROUTER_TITLE").ok(),
    })
  }

  pub fn model(&self) -> &str {
    &self.model
  }

  pub fn with_model(mut self, model: impl Into<String>) -> Self {
    self.model = model.into();
    self
  }

  pub async fn chat_json(
    &self,
    system_prompt: &str,
    user_prompt: &str,
    json_schema: Value,
  ) -> Result<Value, String> {

    let schema_format = json!({
      "type": "json_schema",
      "json_schema": {
        "name": "citation_analysis",
        "strict": true,
        "schema": json_schema
      }

    });

    let messages = json!([
      { "role": "system", "content": system_prompt },
      { "role": "user", "content": user_prompt }
    ]);

    match self.post_chat_messages(&messages, schema_format.clone()).await {
      Ok(v) => Ok(v),
      Err(schema_err) => {
        tracing::warn!(target: "llm.openrouter", "json_schema failed, retrying json_object: {}", schema_err);
        let fallback_format = json!({ "type": "json_object" });
        self.post_chat_messages(&messages, fallback_format).await
      }
    }
  }

  /// Multimodal user message: `user_content` is either a string or an OpenAI-style parts array
  /// (e.g. text + `image_url` with a `data:image/...;base64,...` URL).
  pub async fn chat_json_multimodal(
    &self,
    system_prompt: &str,
    user_content: Value,
    schema_name: &str,
    json_schema: Value,
  ) -> Result<Value, String> {
    let schema_format = json!({
      "type": "json_schema",
      "json_schema": {
        "name": schema_name,
        "strict": true,
        "schema": json_schema
      }
    });

    let messages = json!([
      { "role": "system", "content": system_prompt },
      { "role": "user", "content": user_content }
    ]);

    match self.post_chat_messages(&messages, schema_format.clone()).await {
      Ok(v) => Ok(v),
      Err(schema_err) => {
        tracing::warn!(target: "llm.openrouter", "intake json_schema failed, retrying json_object: {}", schema_err);
        let fallback_format = json!({ "type": "json_object" });
        self.post_chat_messages(&messages, fallback_format).await
      }
    }
  }

  async fn post_chat_messages(
    &self,
    messages: &Value,
    response_format: Value,
  ) -> Result<Value, String> {
    let mut headers = HeaderMap::new();

    headers.insert(
      AUTHORIZATION,
      HeaderValue::from_str(&format!("Bearer {}", self.api_key))
        .map_err(|e| format!("invalid auth header: {e}"))?,
    );

    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    if let Some(r) = &self.http_referer {

      if let Ok(v) = HeaderValue::from_str(r) {
        headers.insert("HTTP-Referer", v);
      }

    }
    if let Some(t) = &self.title {

      if let Ok(v) = HeaderValue::from_str(t) {
        headers.insert("X-Title", v);
      }

    }

    let body = json!({
      "model": self.model,
      "messages": messages,
      "response_format": response_format
    });

    let resp = http_client::shared()
      .post(OPENROUTER_URL)
      .headers(headers)
      .json(&body)
      .send()
      .await
      .map_err(|e| format!("OpenRouter HTTP error: {e}"))?;

    let status = resp.status();

    let payload: Value = resp
      .json()
      .await
      .map_err(|e| format!("OpenRouter JSON decode error: {e}"))?;

    if !status.is_success() {
      return Err(format!("OpenRouter status {}: {}", status, payload));
    }

    let content = extract_content(&payload)?;
    serde_json::from_str::<Value>(&content)
      .map_err(|e| format!("model output is not valid JSON: {e}; content={content}"))
  }
}

fn extract_content(v: &Value) -> Result<String, String> {
  let content = v
    .get("choices")
    .and_then(|x| x.get(0))
    .and_then(|x| x.get("message"))
    .and_then(|x| x.get("content"))
    .ok_or_else(|| format!("missing choices[0].message.content in {}", v))?;

  if let Some(s) = content.as_str() {
    return Ok(s.to_string());
  }

  if let Some(parts) = content.as_array() {
    let mut out = String::new();
    for p in parts {
      if let Some(t) = p.get("text").and_then(|x| x.as_str()) {
        out.push_str(t);
      }
    }
    if !out.trim().is_empty() {
      return Ok(out);
    }
  }

  Err(format!("unexpected content format: {}", content))
}