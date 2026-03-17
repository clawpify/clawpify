use crate::models::product::ProductData;
use serde::Serialize;

const PENALTY_TITLE_SHORT: i32 = 25;
const PENALTY_TITLE_LONG: i32 = 10;
const PENALTY_DESC_MISSING: i32 = 25;
const PENALTY_OG_INCOMPLETE: i32 = 15;
const PENALTY_NO_SCHEMA: i32 = 15;
const PENALTY_NO_PRICE: i32 = 10;
const PENALTY_TITLE_VAGUE: i32 = 10;
const PENALTY_DESC_LACKS_DETAIL: i32 = 10;

const MIN_TITLE_LEN: usize = 10;
const MAX_TITLE_LEN: usize = 70;
const MIN_DESC_LEN: usize = 50;
const MIN_AGENT_DESC_LEN: usize = 100;
const MIN_AGENT_TITLE_LEN: usize = 20;

#[derive(Debug, Serialize)]
pub struct ProductScores {
  pub data_quality: i32,
  pub agent_friendliness: i32,
  pub issues: Vec<String>,
  pub recommendations: Vec<String>,
}

pub fn score_product(product: &ProductData) -> ProductScores {
  let mut issues = Vec::new();
  let mut recommendations = Vec::new();

  let mut data_quality = 100i32;
  data_quality -= check_title(product, &mut issues, &mut recommendations);
  data_quality -= check_description(product, &mut issues, &mut recommendations);
  data_quality -= check_og_tags(product, &mut issues, &mut recommendations);
  data_quality -= check_schema(product, &mut issues, &mut recommendations);
  data_quality -= check_price(product, &mut issues);
  data_quality = data_quality.max(0);

  let mut agent_friendliness = data_quality;
  agent_friendliness -= check_agent_friendliness(product, &mut issues);
  agent_friendliness = agent_friendliness.max(0);

  ProductScores {
    data_quality,
    agent_friendliness,
    issues,
    recommendations,
  }
}

fn check_title(product: &ProductData, issues: &mut Vec<String>, recs: &mut Vec<String>) -> i32 {
  if product.title.is_empty() || product.title.len() < MIN_TITLE_LEN {
    issues.push("Title too short or missing".to_string());
    recs.push("Use a descriptive title (30–70 chars)".to_string());
    return PENALTY_TITLE_SHORT;
  }
  if product.title.len() > MAX_TITLE_LEN {
    issues.push("Title too long for search".to_string());
    return PENALTY_TITLE_LONG;
  }
  0
}

fn check_description(
  product: &ProductData,
  issues: &mut Vec<String>,
  recs: &mut Vec<String>,
) -> i32 {
  let too_short = product
    .description
    .as_ref()
    .map(|d| d.len() < MIN_DESC_LEN)
    .unwrap_or(true);
  if too_short {
    issues.push("Description missing or too brief".to_string());
    recs.push("Add a clear product description with specs".to_string());
    return PENALTY_DESC_MISSING;
  }
  0
}

fn check_og_tags(product: &ProductData, issues: &mut Vec<String>, recs: &mut Vec<String>) -> i32 {
  if product.meta.og_title.is_none() || product.meta.og_description.is_none() {
    issues.push("Open Graph tags incomplete".to_string());
    recs.push("Add og:title and og:description".to_string());
    return PENALTY_OG_INCOMPLETE;
  }
  0
}

fn check_schema(product: &ProductData, issues: &mut Vec<String>, recs: &mut Vec<String>) -> i32 {
  if product.schema.is_none() {
    issues.push("No Schema.org Product".to_string());
    recs.push("Add JSON-LD Product schema".to_string());
    return PENALTY_NO_SCHEMA;
  }
  0
}

fn check_price(product: &ProductData, issues: &mut Vec<String>) -> i32 {
  if product.price.is_none() {
    issues.push("Price not found".to_string());
    return PENALTY_NO_PRICE;
  }
  0
}

fn check_agent_friendliness(product: &ProductData, issues: &mut Vec<String>) -> i32 {
  let mut penalty = 0i32;
  if product.title.len() < MIN_AGENT_TITLE_LEN && !product.title.is_empty() {
    issues.push("Title too vague for agent matching".to_string());
    penalty += PENALTY_TITLE_VAGUE;
  }
  let desc_too_short = product
    .description
    .as_ref()
    .map(|d| d.len() < MIN_AGENT_DESC_LEN)
    .unwrap_or(true);
  if desc_too_short {
    issues.push("Description lacks detail for AI understanding".to_string());
    penalty += PENALTY_DESC_LACKS_DETAIL;
  }
  penalty
}

#[cfg(test)]
mod tests {
  use crate::models::product::{ProductData, ProductMeta};
  use super::*;

  fn make_product(
    title: &str,
    description: Option<&str>,
    price: Option<&str>,
    og_title: Option<&str>,
    og_description: Option<&str>,
    schema: bool,
  ) -> ProductData {
    ProductData {
      id: "https://example.com/product".to_string(),
      title: title.to_string(),
      description: description.map(String::from),
      price: price.map(String::from),
      url: Some("https://example.com/product".to_string()),
      meta: ProductMeta {
        title: Some(title.to_string()),
        description: description.map(String::from),
        og_title: og_title.map(String::from),
        og_description: og_description.map(String::from),
        og_image: None,
      },
      schema: if schema {
        Some(serde_json::json!({"@type": "Product"}))
      } else {
        None
      },
    }
  }

  #[test]
  fn test_score_product_ideal() {
    let product = make_product(
      "Wireless Bluetooth Headphones - Premium Sound",
      Some("High-quality wireless headphones with 30hr battery, noise cancellation, and premium drivers. Ideal for commuting and travel."),
      Some("99.99"),
      Some("Wireless Bluetooth Headphones"),
      Some("High-quality wireless headphones"),
      true,
    );
    let scores = score_product(&product);
    assert_eq!(scores.data_quality, 100);
    assert_eq!(scores.agent_friendliness, 100);
    assert!(scores.issues.is_empty());
  }

  #[test]
  fn test_score_product_poor_title() {
    let product = make_product("Hi", None, None, None, None, false);
    let scores = score_product(&product);
    assert!(scores.data_quality < 100);
    assert!(scores.issues.iter().any(|i| i.contains("Title")));
  }

  #[test]
  fn test_score_product_missing_description() {
    let product = make_product(
      "Good Product Title Here",
      Some("Short"),
      None,
      Some("Good Product"),
      Some("Short"),
      false,
    );
    let scores = score_product(&product);
    assert!(scores.data_quality < 100);
    assert!(scores.issues.iter().any(|i| i.contains("Description")));
  }

  #[test]
  fn test_score_product_no_schema() {
    let product = make_product(
      "Good Product Title Here",
      Some("A proper description that is long enough for the scoring logic to accept."),
      Some("49.99"),
      Some("Good Product"),
      Some("A proper description"),
      false,
    );
    let scores = score_product(&product);
    assert!(scores.issues.iter().any(|i| i.contains("Schema")));
  }
}
