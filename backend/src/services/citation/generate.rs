use crate::dto::citation::{GenerateResponse};
use crate::error::{self, ApiError};
use crate::llm;

use super::prompts;
use super::urls;

fn extract_string_array(json: &serde_json::Value, key: &str) -> Vec<String> {
  json
    .get(key)
    .and_then(|p| p.as_array())
    .map(|a| {
      a.iter()
        .filter_map(|v| v.as_str().map(String::from))
        .collect()
    })
    .unwrap_or_default()
}

pub async fn generate_prompts_and_competitors(
  company_name: &str,
  website_url: &str,
  website_content: Option<String>,
) -> Result<GenerateResponse, ApiError> {
  urls::validate_url(website_url).map_err(|e| error::bad_request(&e))?;

  let provider = llm::citation_provider()
    .ok_or_else(|| error::service_unavailable("No LLM provider configured"))?;

  let gist: Option<String> = if let Some(md) = website_content {
    let truncated = if md.len() > prompts::markdown_truncate_chars() {
      format!("{}...", &md[..prompts::markdown_truncate_chars()])
    } else {
      md
    };
    let gist_prompt = prompts::build_gist_prompt(&truncated);
    let opts = llm::CompleteOptions::default().with_web_search(false);
    llm::run_single_provider(&provider, &gist_prompt, &opts)
      .await
      .ok()
      .map(|r| r.text)
  } else {
    None
  };

  let domain = urls::normalize_domain(website_url);
  let prompts_prompt = prompts::build_prompts_prompt(company_name, &domain, gist.as_deref());

  let opts = llm::CompleteOptions::default()
    .with_json_mode(true)
    .with_web_search(false);
  let result = llm::run_single_provider(&provider, &prompts_prompt, &opts)
    .await
    .map_err(error::bad_gateway)?;

  let parsed: serde_json::Value = serde_json::from_str(&result.text)
    .map_err(|e| error::bad_gateway(format!("Failed to parse AI response: {}", e)))?;

  Ok(GenerateResponse {
    prompts: extract_string_array(&parsed, "prompts"),
    competitors: extract_string_array(&parsed, "competitors"),
  })
}
