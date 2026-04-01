use async_trait::async_trait;
use futures_util::StreamExt;
use serde_json::json;
use tokio::sync::mpsc;

use crate::http_client;
use crate::llm::providers::{LlmProvider, ProviderCompletion};
use crate::llm::types::{ProviderId, SubAgentSpec, WebSearchToolConfig};

const RESPONSES_URL: &str = "https://api.openai.com/v1/responses";

pub struct OpenAiProvider {
  /* openai api key */
  api_key: String,
  /* default model to use */
  default_model: String,
}

enum SseOutcome {
  /* forward the event to the caller */
  Forward(serde_json::Value),
  /* terminal: full `response` object from response.completed */
  Completed(serde_json::Value),
  /* skip the event */
  Skip,
}

impl OpenAiProvider {
  pub fn new(api_key: String, default_model: String) -> Self {
    Self {
      api_key,
      default_model,
    }
  }

  fn effective_model<'a>(&'a self, spec: &'a SubAgentSpec) -> &'a str {
    spec.model.as_deref().unwrap_or(self.default_model.as_str())
  }

  fn build_web_search_tool(cfg: Option<&WebSearchToolConfig>) -> serde_json::Value {
    let mut tool = json!({ "type": "web_search" });
    let Some(cfg) = cfg else {
      return tool;
    };

    if let Some(ref domains) = cfg.allowed_domains {
      tool["filters"] = json!({ "allowed_domains": domains });
    }

    if let Some(loc) = &cfg.user_location {
      tool["user_location"] = serde_json::to_value(loc).unwrap_or_else(|_| json!({}));
    }

    if let Some(live) = cfg.external_web_access {
      tool["external_web_access"] = json!(live);
    }

    tool
  }

  fn build_request_body(&self, spec: &SubAgentSpec) -> serde_json::Value {
    let model = self.effective_model(spec);

    let mut body = json!({
      "model": model,
      "input": spec.input.clone().unwrap_or_else(|| json!(spec.prompt)),
    });

    if spec.web_search {
      let tool = Self::build_web_search_tool(spec.web_search_config.as_ref());
      body["tools"] = json!([tool]);
      body["tool_choice"] = json!("required");
      if spec.include_web_search_sources.unwrap_or(false) {
        body["include"] = json!(["web_search_call.action.sources"]);
      }
    }

    body
  }

  fn collect_urls_from_source_value(value: &serde_json::Value, out: &mut Vec<String>) {
    match value {
      serde_json::Value::Array(items) => {
        for item in items {
          Self::collect_urls_from_source_value(item, out);
        }
      }
      serde_json::Value::Object(map) => {
        if let Some(url) = map.get("url").and_then(|v| v.as_str()) {
          out.push(url.to_string());
        }
        for nested in map.values() {
          Self::collect_urls_from_source_value(nested, out);
        }
      }
      _ => {}
    }
  }

  fn extract_completion(v: &serde_json::Value) -> ProviderCompletion {
    let mut text_parts: Vec<String> = Vec::new();
    let mut sources: Vec<String> = Vec::new();

    let Some(output) = v.get("output").and_then(|o| o.as_array()) else {
      return ProviderCompletion {
        text: String::new(),
        sources,
      };
    };

    for item in output {
      if item.get("type").and_then(|t| t.as_str()) == Some("web_search_call") {
        if let Some(sources_val) = item.get("action").and_then(|a| a.get("sources")) {
          Self::collect_urls_from_source_value(sources_val, &mut sources);
        }
      }
      if item.get("type").and_then(|t| t.as_str()) != Some("message") {
        continue;
      }
      let Some(content) = item.get("content").and_then(|c| c.as_array()) else {
        continue;
      };
      for part in content {
        if let Some(t) = part.get("text").and_then(|x| x.as_str()) {
          text_parts.push(t.to_string());
        }
        let Some(annotations) = part.get("annotations").and_then(|a| a.as_array()) else {
          continue;
        };
        for ann in annotations {
          if ann.get("type").and_then(|t| t.as_str()) == Some("url_citation") {
            if let Some(u) = ann.get("url").and_then(|x| x.as_str()) {
              sources.push(u.to_string());
            }
          }
        }
      }
    }

    sources.sort();
    sources.dedup();

    ProviderCompletion {
      text: text_parts.join("\n"),
      sources,
    }
  }

  fn forwardable_event_type(ty: &str) -> bool {
    matches!(
      ty,
      "response.output_text.delta"
        | "response.output_item.added"
        | "response.output_item.done"
        | "response.content_part.added"
        | "response.in_progress"
        | "response.output_text_annotation.added"
    )
  }

  fn redact_openai_event(v: &serde_json::Value) -> serde_json::Value {
    let mut v = v.clone();
    if let Some(obj) = v.as_object_mut() {
      obj.remove("input");
    }
    v
  }

  /// Parses one SSE line (`data: {...}`).
  fn parse_sse_line(line: &str) -> Result<SseOutcome, String> {
    let line = line.trim_end_matches('\r').trim();
    if line.is_empty() {
      return Ok(SseOutcome::Skip);
    }
    let payload = if let Some(rest) = line.strip_prefix("data:") {
      rest.trim_start()
    } else {
      return Ok(SseOutcome::Skip);
    };
    if payload == "[DONE]" {
      return Ok(SseOutcome::Skip);
    }

    let v: serde_json::Value =
      serde_json::from_str(payload).map_err(|e| format!("OpenAI SSE JSON: {e}"))?;

    let ty = v.get("type").and_then(|t| t.as_str()).unwrap_or("unknown");
    let size = serde_json::to_string(&v).map(|s| s.len()).unwrap_or(0);
    tracing::debug!(target: "llm.openai.stream", event_type = ty, size);

    match ty {
      "error" => {
        let msg = v
          .get("message")
          .and_then(|m| m.as_str())
          .unwrap_or("unknown error");
        Err(format!("OpenAI stream error: {msg}"))
      }
      "response.failed" => Err(format!("OpenAI response failed: {v}")),
      "response.completed" => match v.get("response") {
        Some(r) => Ok(SseOutcome::Completed(r.clone())),
        None => Err("response.completed event missing response".to_string()),
      },
      _ => {
        if Self::forwardable_event_type(ty) {
          Ok(SseOutcome::Forward(Self::redact_openai_event(&v)))
        } else {
          Ok(SseOutcome::Skip)
        }
      }
    }
  }

  async fn read_sse_stream(
    &self,
    mut line_buf: String,
    mut stream: impl futures_util::Stream<Item = Result<bytes::Bytes, reqwest::Error>> + Unpin,
    event_tx: Option<&mpsc::Sender<serde_json::Value>>,
  ) -> Result<serde_json::Value, String> {
    let mut final_response: Option<serde_json::Value> = None;

    while let Some(chunk) = stream.next().await {
      let chunk = chunk.map_err(|e| format!("OpenAI stream read: {e}"))?;
      line_buf.push_str(&String::from_utf8_lossy(&chunk));

      while let Some(pos) = line_buf.find('\n') {
        let line = line_buf[..pos].to_string();
        line_buf.drain(..=pos);

        match Self::parse_sse_line(&line)? {
          SseOutcome::Forward(ev) => {
            if let Some(tx) = event_tx.as_ref() {
              let _ = tx.send(ev).await;
            }
          }
          SseOutcome::Completed(r) => {
            final_response = Some(r);
          }
          SseOutcome::Skip => {}
        }
      }
    }

    if !line_buf.trim().is_empty() {
      match Self::parse_sse_line(line_buf.trim())? {
        SseOutcome::Forward(ev) => {
          if let Some(tx) = event_tx.as_ref() {
            let _ = tx.send(ev).await;
          }
        }
        SseOutcome::Completed(r) => {
          final_response = Some(r);
        }
        SseOutcome::Skip => {}
      }
    }

    final_response.ok_or_else(|| "stream ended without response.completed".to_string())
  }

  async fn complete_streaming_body(
    &self,
    spec: &SubAgentSpec,
    event_tx: Option<mpsc::Sender<serde_json::Value>>,
  ) -> Result<ProviderCompletion, String> {
    let mut body = self.build_request_body(spec);
    body["stream"] = json!(true);

    let client = http_client::shared();
    let resp = client
      .post(RESPONSES_URL)
      .bearer_auth(&self.api_key)
      .json(&body)
      .send()
      .await
      .map_err(|e| format!("OpenAI HTTP: {e}"))?;

    let status = resp.status();
    if !status.is_success() {
      let val: serde_json::Value = resp.json().await.map_err(|e| format!("OpenAI JSON: {e}"))?;
      return Err(val.to_string());
    }

    let stream = resp.bytes_stream();
    let line_buf = String::new();
    let event_ref = event_tx.as_ref();
    let v = self.read_sse_stream(line_buf, stream, event_ref).await?;
    Ok(Self::extract_completion(&v))
  }

  async fn complete_streaming(&self, spec: &SubAgentSpec) -> Result<ProviderCompletion, String> {
    self.complete_streaming_body(spec, None).await
  }

  async fn complete_non_streaming(&self, spec: &SubAgentSpec) -> Result<ProviderCompletion, String> {
    let body = self.build_request_body(spec);
    let client = http_client::shared();

    let resp = client
      .post(RESPONSES_URL)
      .bearer_auth(&self.api_key)
      .json(&body)
      .send()
      .await
      .map_err(|e| format!("OpenAI HTTP: {e}"))?;

    let status = resp.status();
    let val: serde_json::Value = resp.json().await.map_err(|e| format!("OpenAI JSON: {e}"))?;

    if !status.is_success() {
      return Err(val.to_string());
    }

    Ok(Self::extract_completion(&val))
  }
}

#[async_trait]
impl LlmProvider for OpenAiProvider {
  async fn complete(&self, spec: &SubAgentSpec) -> Result<ProviderCompletion, String> {
    if spec.provider.is_some() && spec.provider != Some(ProviderId::OpenAI) {
      return Err("OpenAiProvider received non-OpenAI provider id".to_string());
    }

    if spec.stream_debug_logs.unwrap_or(false) {
      match self.complete_streaming(spec).await {
        Ok(c) => return Ok(c),
        Err(e) => {
          tracing::warn!(target: "llm.openai.stream", "streaming failed, falling back: {e}");
        }
      }
    }

    self.complete_non_streaming(spec).await
  }

  async fn complete_with_events(
    &self,
    spec: &SubAgentSpec,
    event_tx: mpsc::Sender<serde_json::Value>,
  ) -> Result<ProviderCompletion, String> {
    if spec.provider.is_some() && spec.provider != Some(ProviderId::OpenAI) {
      return Err("OpenAiProvider received non-OpenAI provider id".to_string());
    }

    self.complete_streaming_body(spec, Some(event_tx)).await
  }
}
