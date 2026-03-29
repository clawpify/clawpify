use base64::Engine;
use serde_json::json;

use crate::dto::price_estimation::{Comp, PriceEstimationResponse, PriceRange, ProductAttributes};
use crate::http_client;

const OPENAI_RESPONSES_URL: &str = "https://api.openai.com/v1/responses";
const EBAY_TOKEN_URL: &str = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_SEARCH_URL: &str = "https://api.ebay.com/buy/browse/v1/item_summary/search";

/// Extract product attributes from images using OpenAI's vision model.
pub async fn analyze_images(
    images_base64: &[String],
    description: Option<&str>,
) -> Result<ProductAttributes, String> {
    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| "OPENAI_API_KEY not set".to_string())?;

    let model = std::env::var("OPENAI_VISION_MODEL")
        .unwrap_or_else(|_| "gpt-4o".to_string());

    let mut content = Vec::new();

    for img_b64 in images_base64 {
        content.push(json!({
            "type": "input_image",
            "image_url": img_b64,
        }));
    }

    let prompt = if let Some(desc) = description {
        format!(
            "Analyze this product image(s). The seller describes it as: \"{desc}\"\n\n\
             Extract the following as JSON (no markdown, just raw JSON):\n\
             {{\n  \"title\": \"concise product title\",\n  \"category\": \"product category\",\n  \
             \"brand\": \"brand name or null\",\n  \"condition\": \"new/like new/good/fair/poor or null\",\n  \
             \"color\": \"primary color or null\",\n  \"keywords\": [\"search\", \"keywords\", \"for\", \"finding\", \"similar\", \"listings\"]\n}}"
        )
    } else {
        "Analyze this product image(s). Extract the following as JSON (no markdown, just raw JSON):\n\
         {\n  \"title\": \"concise product title\",\n  \"category\": \"product category\",\n  \
         \"brand\": \"brand name or null\",\n  \"condition\": \"new/like new/good/fair/poor or null\",\n  \
         \"color\": \"primary color or null\",\n  \"keywords\": [\"search\", \"keywords\", \"for\", \"finding\", \"similar\", \"listings\"]\n}"
            .to_string()
    };

    content.push(json!({
        "type": "input_text",
        "text": prompt,
    }));

    let body = json!({
        "model": model,
        "input": [{
            "role": "user",
            "content": content,
        }],
    });

    let client = http_client::shared();
    let resp = client
        .post(OPENAI_RESPONSES_URL)
        .bearer_auth(&api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("OpenAI vision request failed: {e}"))?;

    let status = resp.status();
    let val: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("OpenAI vision response parse failed: {e}"))?;

    if !status.is_success() {
        return Err(format!("OpenAI vision API error: {val}"));
    }

    let text = extract_response_text(&val);
    parse_product_attributes(&text)
}

fn extract_response_text(v: &serde_json::Value) -> String {
    let mut parts = Vec::new();
    if let Some(output) = v.get("output").and_then(|o| o.as_array()) {
        for item in output {
            if item.get("type").and_then(|t| t.as_str()) != Some("message") {
                continue;
            }
            if let Some(content) = item.get("content").and_then(|c| c.as_array()) {
                for part in content {
                    if let Some(t) = part.get("text").and_then(|x| x.as_str()) {
                        parts.push(t.to_string());
                    }
                }
            }
        }
    }
    parts.join("\n")
}

fn parse_product_attributes(text: &str) -> Result<ProductAttributes, String> {
    // Strip markdown code fences if present
    let cleaned = text
        .trim()
        .strip_prefix("```json")
        .or_else(|| text.trim().strip_prefix("```"))
        .unwrap_or(text.trim());
    let cleaned = cleaned
        .strip_suffix("```")
        .unwrap_or(cleaned)
        .trim();

    serde_json::from_str::<ProductAttributes>(cleaned)
        .map_err(|e| format!("Failed to parse product attributes from vision response: {e}\nRaw: {text}"))
}

/// Get an eBay OAuth2 client credentials token.
async fn get_ebay_token(client_id: &str, client_secret: &str) -> Result<String, String> {
    let client = http_client::shared();
    let credentials = base64::engine::general_purpose::STANDARD
        .encode(format!("{client_id}:{client_secret}"));

    let resp = client
        .post(EBAY_TOKEN_URL)
        .header("Authorization", format!("Basic {credentials}"))
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body("grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope")
        .send()
        .await
        .map_err(|e| format!("eBay token request failed: {e}"))?;

    let val: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("eBay token response parse failed: {e}"))?;

    val.get("access_token")
        .and_then(|t| t.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| format!("eBay token response missing access_token: {val}"))
}

/// Search eBay Browse API for similar listings.
pub async fn search_ebay(attributes: &ProductAttributes, limit: u32) -> Result<Vec<Comp>, String> {
    let client_id = std::env::var("EBAY_CLIENT_ID")
        .map_err(|_| "EBAY_CLIENT_ID not set".to_string())?;
    let client_secret = std::env::var("EBAY_CLIENT_SECRET")
        .map_err(|_| "EBAY_CLIENT_SECRET not set".to_string())?;

    let token = get_ebay_token(&client_id, &client_secret).await?;

    let query = build_search_query(attributes);
    let client = http_client::shared();

    let resp = client
        .get(EBAY_SEARCH_URL)
        .bearer_auth(&token)
        .query(&[
            ("q", query.as_str()),
            ("limit", &limit.to_string()),
            ("sort", "price"),
        ])
        .send()
        .await
        .map_err(|e| format!("eBay search request failed: {e}"))?;

    let status = resp.status();
    let val: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("eBay search response parse failed: {e}"))?;

    if !status.is_success() {
        return Err(format!("eBay search API error ({}): {val}", status));
    }

    parse_ebay_results(&val)
}

fn build_search_query(attrs: &ProductAttributes) -> String {
    let mut parts = Vec::new();
    if let Some(ref brand) = attrs.brand {
        parts.push(brand.clone());
    }
    parts.push(attrs.title.clone());
    // Add top keywords for better matching
    for kw in attrs.keywords.iter().take(3) {
        if !parts.iter().any(|p| p.to_lowercase().contains(&kw.to_lowercase())) {
            parts.push(kw.clone());
        }
    }
    parts.join(" ")
}

fn parse_ebay_results(val: &serde_json::Value) -> Result<Vec<Comp>, String> {
    let items = val
        .get("itemSummaries")
        .and_then(|s| s.as_array())
        .cloned()
        .unwrap_or_default();

    let mut comps = Vec::new();
    for item in &items {
        let title = item
            .get("title")
            .and_then(|t| t.as_str())
            .unwrap_or("")
            .to_string();

        let price_val = item
            .get("price")
            .and_then(|p| p.get("value"))
            .and_then(|v| v.as_str())
            .and_then(|s| s.parse::<f64>().ok())
            .unwrap_or(0.0);

        let currency = item
            .get("price")
            .and_then(|p| p.get("currency"))
            .and_then(|c| c.as_str())
            .unwrap_or("USD")
            .to_string();

        let condition = item
            .get("condition")
            .and_then(|c| c.as_str())
            .map(|s| s.to_string());

        let url = item
            .get("itemWebUrl")
            .and_then(|u| u.as_str())
            .unwrap_or("")
            .to_string();

        let image_url = item
            .get("image")
            .and_then(|i| i.get("imageUrl"))
            .and_then(|u| u.as_str())
            .map(|s| s.to_string());

        if price_val > 0.0 {
            comps.push(Comp {
                title,
                price: price_val,
                currency,
                condition,
                source: "ebay".to_string(),
                url,
                image_url,
            });
        }
    }

    Ok(comps)
}

/// Use OpenAI web search to find additional comps from Facebook Marketplace and other sources.
pub async fn search_web_comps(attributes: &ProductAttributes, limit: u32) -> Result<Vec<Comp>, String> {
    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| "OPENAI_API_KEY not set".to_string())?;

    let query = build_search_query(attributes);
    let prompt = format!(
        "Search for current listings of \"{query}\" on Facebook Marketplace, Craigslist, and other resale platforms. \
         Return up to {limit} listings as a JSON array (no markdown, just raw JSON):\n\
         [{{\"title\": \"...\", \"price\": 99.99, \"currency\": \"USD\", \"condition\": \"...\", \"source\": \"facebook_marketplace\", \"url\": \"...\"}}]\n\
         If you cannot find real listings, return an empty array []."
    );

    let body = json!({
        "model": "gpt-4o-mini",
        "input": prompt,
        "tools": [{ "type": "web_search" }],
        "tool_choice": "required",
    });

    let client = http_client::shared();
    let resp = client
        .post(OPENAI_RESPONSES_URL)
        .bearer_auth(&api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Web search request failed: {e}"))?;

    let status = resp.status();
    let val: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Web search response parse failed: {e}"))?;

    if !status.is_success() {
        tracing::warn!(target: "price_estimation", "Web search API error: {val}");
        return Ok(Vec::new());
    }

    let text = extract_response_text(&val);
    parse_web_comps(&text)
}

fn parse_web_comps(text: &str) -> Result<Vec<Comp>, String> {
    let cleaned = text
        .trim()
        .strip_prefix("```json")
        .or_else(|| text.trim().strip_prefix("```"))
        .unwrap_or(text.trim());
    let cleaned = cleaned.strip_suffix("```").unwrap_or(cleaned).trim();

    #[derive(serde::Deserialize)]
    struct RawComp {
        title: Option<String>,
        price: Option<f64>,
        currency: Option<String>,
        condition: Option<String>,
        source: Option<String>,
        url: Option<String>,
    }

    let raw: Vec<RawComp> = serde_json::from_str(cleaned).unwrap_or_default();
    Ok(raw
        .into_iter()
        .filter_map(|r| {
            let price = r.price?;
            if price <= 0.0 {
                return None;
            }
            Some(Comp {
                title: r.title.unwrap_or_default(),
                price,
                currency: r.currency.unwrap_or_else(|| "USD".to_string()),
                condition: r.condition,
                source: r.source.unwrap_or_else(|| "web".to_string()),
                url: r.url.unwrap_or_default(),
                image_url: None,
            })
        })
        .collect())
}

/// Calculate a price range from the collected comps.
pub fn calculate_price_range(comps: &[Comp]) -> PriceRange {
    if comps.is_empty() {
        return PriceRange {
            low: 0.0,
            mid: 0.0,
            high: 0.0,
            currency: "USD".to_string(),
            comp_count: 0,
        };
    }

    let mut prices: Vec<f64> = comps.iter().map(|c| c.price).collect();
    prices.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let currency = comps
        .first()
        .map(|c| c.currency.clone())
        .unwrap_or_else(|| "USD".to_string());

    // Use percentiles: low = 25th, mid = median, high = 75th
    let len = prices.len();
    let low = percentile(&prices, 0.25);
    let mid = percentile(&prices, 0.50);
    let high = percentile(&prices, 0.75);

    PriceRange {
        low: round2(low),
        mid: round2(mid),
        high: round2(high),
        currency,
        comp_count: len,
    }
}

fn percentile(sorted: &[f64], p: f64) -> f64 {
    if sorted.is_empty() {
        return 0.0;
    }
    if sorted.len() == 1 {
        return sorted[0];
    }
    let idx = p * (sorted.len() as f64 - 1.0);
    let lo = idx.floor() as usize;
    let hi = idx.ceil() as usize;
    let frac = idx - lo as f64;
    sorted[lo] * (1.0 - frac) + sorted[hi] * frac
}

fn round2(v: f64) -> f64 {
    (v * 100.0).round() / 100.0
}

/// Run the full price estimation pipeline.
pub async fn estimate(
    images_base64: Vec<String>,
    description: Option<String>,
    limit: u32,
) -> Result<PriceEstimationResponse, String> {
    let attributes = analyze_images(&images_base64, description.as_deref()).await?;

    let ebay_available = std::env::var("EBAY_CLIENT_ID").is_ok()
        && std::env::var("EBAY_CLIENT_SECRET").is_ok();

    // Run eBay search and web search concurrently
    let (ebay_result, web_result) = tokio::join!(
        async {
            if ebay_available {
                search_ebay(&attributes, limit).await
            } else {
                Ok(Vec::new())
            }
        },
        search_web_comps(&attributes, limit),
    );

    let mut comps = Vec::new();
    match ebay_result {
        Ok(mut c) => comps.append(&mut c),
        Err(e) => tracing::warn!(target: "price_estimation", "eBay search failed: {e}"),
    }
    match web_result {
        Ok(mut c) => comps.append(&mut c),
        Err(e) => tracing::warn!(target: "price_estimation", "Web search failed: {e}"),
    }

    let price_range = calculate_price_range(&comps);

    Ok(PriceEstimationResponse {
        attributes,
        comps,
        price_range,
    })
}
