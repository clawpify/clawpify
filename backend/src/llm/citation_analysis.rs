use std::collections::{HashMap, HashSet};

use serde::Deserialize;
use serde_json::{json, Value};

use crate::dto::llm::{CitationAnalyzeRequest, CitationAnalyzeResponse, CitationAnalysisResult, CitationItem};
use crate::llm::openrouter::OpenRouterClient;

const DEFAULT_MAX_CITATIONS: usize = 20;
const UNKNOWN_SENTIMENT: u8 = 50;
const UNKNOWN_CONFIDENCE: u8 = 1;

#[derive(Debug, Deserialize)]
struct ModelEnvelope {
  #[serde(default)]
  results: Vec<ModelResult>,
}

#[derive(Debug, Deserialize)]
struct ModelResult {
  url: String,
  #[serde(default)]
  sentiment_score: Option<i64>,
  #[serde(default)]
  confidence: Option<i64>,
  #[serde(default)]
  regions: Option<Vec<String>>,
  #[serde(default)]
  unknown: Option<bool>,
}

pub async fn analyze(req: CitationAnalyzeRequest) -> Result<CitationAnalyzeResponse, String> {
  let client = OpenRouterClient::from_env()?;
  let citations = normalize(req.citations, req.max_citations.unwrap_or(DEFAULT_MAX_CITATIONS));

  if citations.is_empty() {
    return Ok(CitationAnalyzeResponse {
      provider: "openrouter".to_string(),
      model: client.model().to_string(),
      results: vec![],
      error: None,
    });
  }

  let system_prompt = "You analyze citation snippets for sentiment and geography. Use only provided text; do not guess external facts. Return JSON only.";
  let user_prompt = build_user_prompt(&citations);
  let schema = response_schema();

  let parsed = client.chat_json(system_prompt, &user_prompt, schema).await;
  let mut output = default_unknown_results(&citations);

  match parsed {
    Ok(raw) => {
      let envelope = parse_envelope(raw)?;
      let by_url: HashMap<String, ModelResult> = envelope
        .results
        .into_iter()
        .map(|r| (normalize_url_key(&r.url), r))
        .collect();

      for row in &mut output {
        if let Some(m) = by_url.get(&normalize_url_key(&row.url)) {
          row.sentiment_score = clamp_1_100(m.sentiment_score.unwrap_or(UNKNOWN_SENTIMENT as i64));
          row.confidence = clamp_1_100(m.confidence.unwrap_or(UNKNOWN_CONFIDENCE as i64));
          row.regions = m.regions.clone().unwrap_or_default();
          row.unknown = m.unknown.unwrap_or(false);
        }
      }

      Ok(CitationAnalyzeResponse {
        provider: "openrouter".to_string(),
        model: client.model().to_string(),
        results: output,
        error: None,
      })
    }
    Err(e) => Ok(CitationAnalyzeResponse {
      provider: "openrouter".to_string(),
      model: client.model().to_string(),
      results: output,
      error: Some(e),
    }),
  }
}

fn response_schema() -> Value {
  json!({
    "type": "object",
    "additionalProperties": false,
    "required": ["results"],
    "properties": {
      "results": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": ["url", "sentiment_score", "confidence", "regions", "unknown"],
          "properties": {
            "url": { "type": "string" },
            "sentiment_score": { "type": "integer", "minimum": 1, "maximum": 100 },
            "confidence": { "type": "integer", "minimum": 1, "maximum": 100 },
            "regions": { "type": "array", "items": { "type": "string" } },
            "unknown": { "type": "boolean" }
          }
        }
      }
    }
  })
}

fn parse_envelope(v: Value) -> Result<ModelEnvelope, String> {
  if v.get("results").is_some() {
    return serde_json::from_value(v).map_err(|e| format!("invalid model envelope: {e}"));
  }

  if v.is_array() {
    let results: Vec<ModelResult> =
      serde_json::from_value(v).map_err(|e| format!("invalid model array: {e}"))?;
    return Ok(ModelEnvelope { results });
  }

  Err(format!("unexpected model json shape: {v}"))
}

fn build_user_prompt(citations: &[CitationItem]) -> String {
  let mut out = String::from(
    "Analyze each citation. sentiment_score is 1..100 (1 very negative, 50 neutral/unknown, 100 very positive). confidence is 1..100.\n",
  );

  for (i, c) in citations.iter().enumerate() {
    out.push_str(&format!("\n[{}] url: {}\n", i + 1, c.url.trim()));
    out.push_str("snippet:\n");
    out.push_str(c.snippet.as_deref().unwrap_or("(none)"));
    out.push('\n');
  }

  out
}

fn normalize(input: Vec<CitationItem>, max_citations: usize) -> Vec<CitationItem> {
  let cap = max_citations.max(1);
  let mut seen = HashSet::new();
  let mut out = Vec::with_capacity(cap);

  for item in input {
    let url = item.url.trim().to_string();
    if url.is_empty() {
      continue;
    }

    let key = normalize_url_key(&url);

    if seen.contains(&key) {
      continue;
    }
    
    seen.insert(key);

    out.push(CitationItem {
      url,
      snippet: item.snippet.map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
    });

    if out.len() >= cap {
      break;
    }
  }

  out
}

fn default_unknown_results(citations: &[CitationItem]) -> Vec<CitationAnalysisResult> {
  citations
    .iter()
    .map(|c| CitationAnalysisResult {
      url: c.url.clone(),
      sentiment_score: UNKNOWN_SENTIMENT,
      confidence: UNKNOWN_CONFIDENCE,
      regions: vec![],
      unknown: true,
    })
    .collect()
}

fn normalize_url_key(url: &str) -> String {
  url.trim().trim_end_matches('/').to_lowercase()
}

fn clamp_1_100(v: i64) -> u8 {
  v.clamp(1, 100) as u8
}



