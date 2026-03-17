use super::urls::normalize_for_match;

const STOPWORDS: &[&str] = &[
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with", "by", "from", "as",
  "is", "was", "are", "be", "have", "has", "do", "will", "would", "can", "product", "company",
  "platform", "solution", "service", "model", "version", "tools", "software", "enterprise",
];

const MSG_TYPE: &str = "message";
const WEB_SEARCH_TYPE: &str = "web_search_call";
const URL_CITATION_TYPE: &str = "url_citation";
const SOURCE_TYPE_URL: &str = "url";

fn is_stopword(s: &str) -> bool {
  let lower = s.to_lowercase();
  STOPWORDS.iter().any(|&w| w == lower)
}

pub fn extract_brands_from_text(text: &str) -> Vec<String> {
  let mut brands = Vec::new();
  let re = regex::Regex::new(r"(?i)\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)\b").ok();
  if let Some(re) = re {
    for cap in re.captures_iter(text) {
      let name = cap
        .get(1)
        .map(|m| m.as_str().trim().to_string())
        .unwrap_or_default();
      if name.len() >= 2 && name.len() <= 50 && !brands.contains(&name) && !is_stopword(&name) {
        brands.push(name);
      }
    }
  }
  brands.truncate(30);
  brands
}

fn extract_message_content(
  content: &[serde_json::Value],
  citation_urls: &mut Vec<String>,
  mentioned_brands: &mut Vec<String>,
  domain: &str,
  company_name: &str,
) -> (Option<String>, bool) {
  let mut response_text = None;
  let mut your_product_mentioned = false;

  for block in content {
    if let Some(text) = block.get("text").and_then(|t| t.as_str()) {
      response_text = Some(text.to_string());
      let brands = extract_brands_from_text(text);
      for b in brands {
        if !mentioned_brands.contains(&b) {
          mentioned_brands.push(b);
        }
      }
      let text_norm = normalize_for_match(text);
      let company_norm = normalize_for_match(company_name);
      if !company_norm.is_empty() && text_norm.contains(&company_norm) {
        your_product_mentioned = true;
      }
    }
    if let Some(annotations) = block.get("annotations").and_then(|a| a.as_array()) {
      for ann in annotations {
        if ann.get("type").and_then(|t| t.as_str()) == Some(URL_CITATION_TYPE) {
          if let Some(url) = ann.get("url").and_then(|u| u.as_str()) {
            if !citation_urls.contains(&url.to_string()) {
              citation_urls.push(url.to_string());
            }
            if url.to_lowercase().contains(domain) {
              your_product_mentioned = true;
            }
          }
        }
      }
    }
  }

  (response_text, your_product_mentioned)
}

fn extract_web_search_sources(
  sources: &[serde_json::Value],
  citation_urls: &mut Vec<String>,
  domain: &str,
) -> bool {
  let mut your_product_mentioned = false;
  for source in sources {
    if source.get("type").and_then(|t| t.as_str()) == Some(SOURCE_TYPE_URL) {
      if let Some(url) = source.get("url").and_then(|u| u.as_str()) {
        if !citation_urls.contains(&url.to_string()) {
          citation_urls.push(url.to_string());
        }
        if url.to_lowercase().contains(domain) {
          your_product_mentioned = true;
        }
      }
    }
  }
  your_product_mentioned
}

fn check_mentioned_brands(mentioned_brands: &[String], company_name: &str) -> bool {
  let company_norm = normalize_for_match(company_name);
  if company_norm.is_empty() {
    return false;
  }
  mentioned_brands
    .iter()
    .any(|b| normalize_for_match(b) == company_norm)
}

pub fn parse_openai_response(
  body: &serde_json::Value,
  domain: &str,
  company_name: &str,
) -> (Option<String>, Vec<String>, Vec<String>, bool) {
  let mut response_text = None;
  let mut citation_urls: Vec<String> = Vec::new();
  let mut mentioned_brands: Vec<String> = Vec::new();
  let mut your_product_mentioned = false;

  let output = match body.get("output").and_then(|o| o.as_array()) {
    Some(o) => o,
    None => return (None, vec![], vec![], false),
  };

  for item in output {
    if item.get("type").and_then(|t| t.as_str()) == Some(MSG_TYPE) {
      if let Some(content) = item.get("content").and_then(|c| c.as_array()) {
        let (text, mentioned) = extract_message_content(
          content,
          &mut citation_urls,
          &mut mentioned_brands,
          domain,
          company_name,
        );
        response_text = response_text.or(text);
        your_product_mentioned = your_product_mentioned || mentioned;
      }
    }
    if item.get("type").and_then(|t| t.as_str()) == Some(WEB_SEARCH_TYPE) {
      if let Some(action) = item.get("action") {
        if let Some(sources) = action.get("sources").and_then(|s| s.as_array()) {
          your_product_mentioned = your_product_mentioned
            || extract_web_search_sources(sources, &mut citation_urls, domain);
        }
      }
    }
  }

  if check_mentioned_brands(&mentioned_brands, company_name) {
    your_product_mentioned = true;
  }

  (
    response_text,
    citation_urls,
    mentioned_brands,
    your_product_mentioned,
  )
}
