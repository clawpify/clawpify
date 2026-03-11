@[derive(Clone, Debug)]
pub struct ProviderConfig {
  pub api_key: String,
  pub model: Option<String>,
}

fn get_opt(key: &str) -> Option<String> {
  std::env::var(key).ok().filter(|s| !s.trim().is_empty())
}

pub fn openai_config() -> Option<ProviderConfig> {
  let api_key = get_opt("OPENAI_API_KEY")?;

  let model = get_opt("OPENAI_PROMPT_MODEL")
    .or_else(|| get_opt("OPENAI_CITATION_MODEL"))
    .or(Some("gpt-4o".to_string()));
  Some(ProviderConfig { api_key, model })
}

pub fn perplexity_config() -> Option<ProviderConfig> {
  let api_key = get_opt("PERPLEXITY_API_KEY")?;
  let model = get_opt("PERPLEXITY_MODEL")
    .unwrap_or_else(|| "llama-3.1-sonar-large-128k-online".to_string());
  Some(ProviderConfig { api_key, model: Some(model) })
}

pub fn gemini_config() -> Option<ProviderConfig> {
  let api_key = get_opt("GEMINI_API_KEY")?;
  let model = get_opt("GEMINI_MODEL")
    .unwrap_or_else(|| "gemini-2.0-flash".to_string());
  Some(ProviderConfig { api_key, model: Some(model) })
}

