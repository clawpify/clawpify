use axum::{extract::Path, Extension, Json};
use futures::future::join_all;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use super::crawl;

const OPENAI_RESPONSES_URL: &str = "https://api.openai.com/v1/responses";
const OPENAI_CHAT_URL: &str = "https://api.openai.com/v1/chat/completions";
const PROMPT_MODEL: &str = "gpt-4o-mini";
const MARKDOWN_TRUNCATE_CHARS: usize = 4000;

#[derive(Deserialize)]
pub struct GenerateRequest {
    pub company_name: String,
    pub website_url: String,
}

#[derive(Serialize)]
pub struct GenerateResponse {
    pub prompts: Vec<String>,
    pub competitors: Vec<String>,
}

#[derive(Deserialize)]
pub struct CreateCitationRequest {
    pub company_name: String,
    pub website_url: String,
    #[serde(default)]
    pub product_description: String,
    #[serde(default)]
    pub custom_prompts: Option<Vec<String>>,
    #[serde(default)]
    pub run_search: Option<bool>,
}

#[derive(Serialize)]
pub struct CreateCitationResponse {
    pub id: Uuid,
}

pub async fn generate_prompts_and_competitors(
    Json(body): Json<GenerateRequest>,
) -> Result<Json<GenerateResponse>, (axum::http::StatusCode, Json<serde_json::Value>)> {
    let company_name = body.company_name.trim();
    let website_url = body.website_url.trim();

    if company_name.is_empty() || website_url.is_empty() {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "company_name and website_url are required" })),
        ));
    }

    let api_key = std::env::var("OPENAI_API_KEY")
        .ok()
        .filter(|k| !k.is_empty())
        .ok_or((
            axum::http::StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({ "error": "OPENAI_API_KEY not configured" })),
        ))?;

    let scrape_url = normalize_url_for_scrape(website_url);
    let firecrawl_key = std::env::var("FIRECRAWL_API_KEY").ok().filter(|k| !k.is_empty());

    let gist: Option<String> = match crawl::scrape_url_for_content(&scrape_url, firecrawl_key.as_deref()).await {
        Some(md) => {
            let truncated = if md.len() > MARKDOWN_TRUNCATE_CHARS {
                format!("{}...", &md[..MARKDOWN_TRUNCATE_CHARS])
            } else {
                md
            };
            let gist_prompt = format!(
                "Summarize in 2–3 sentences what this company/product does based on this website content:\n\n{}",
                truncated
            );
            call_openai(&api_key, PROMPT_MODEL, &gist_prompt, false).await.ok()
        }
        None => None,
    };

    let prompts_prompt = if let Some(ref gist) = gist {
        format!(
            r#"Company: "{}". Website: {}.

Website gist: {}

Generate a JSON object with exactly two keys:
1. "prompts": an array of 5 search queries that someone might ask ChatGPT when looking for products/services like this company offers. Each query should be the kind that would return product recommendations with citations. Examples: "What are the best X tools?", "Recommend X for B2B".
2. "competitors": an array of 5-10 competitor company/brand names that operate in the same space.

Return ONLY valid JSON, no other text."#,
            company_name,
            normalize_domain(website_url),
            gist
        )
    } else {
        format!(
            r#"Given this company: "{}" (website: {}).

Generate a JSON object with exactly two keys:
1. "prompts": an array of 5 search queries that someone might ask ChatGPT when looking for products/services like this company offers. Each query should be the kind that would return product recommendations with citations. Examples: "What are the best X tools?", "Recommend X for B2B".
2. "competitors": an array of 5-10 competitor company/brand names that operate in the same space.

Return ONLY valid JSON, no other text."#,
            company_name,
            normalize_domain(website_url)
        )
    };

    let content = call_openai(&api_key, PROMPT_MODEL, &prompts_prompt, true).await.map_err(|e| {
        (
            axum::http::StatusCode::BAD_GATEWAY,
            Json(serde_json::json!({ "error": e })),
        )
    })?;

    let parsed: serde_json::Value = serde_json::from_str(&content).map_err(|e| {
        (
            axum::http::StatusCode::BAD_GATEWAY,
            Json(serde_json::json!({ "error": format!("Failed to parse AI response: {}", e) })),
        )
    })?;

    let prompts: Vec<String> = parsed
        .get("prompts")
        .and_then(|p| p.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default();

    let competitors: Vec<String> = parsed
        .get("competitors")
        .and_then(|c| c.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default();

    Ok(Json(GenerateResponse {
        prompts: if prompts.is_empty() {
            vec![
                format!("What are the best {} tools or solutions?", company_name),
                format!("Recommend {} for B2B. Which companies should I consider?", company_name),
                format!("Top {} products and vendors in 2024", company_name),
                format!("Compare {} solutions. Which ones are worth trying?", company_name),
                format!("I need {} for my business. What do you recommend?", company_name),
            ]
        } else {
            prompts
        },
        competitors,
    }))
}

/// Normalizes a URL for scraping: ensures it has https:// scheme.
pub(crate) fn normalize_url_for_scrape(url: &str) -> String {
    let url = url.trim();
    if url.starts_with("https://") {
        return url.to_string();
    }
    if url.starts_with("http://") {
        return url.replacen("http://", "https://", 1);
    }
    format!("https://{}", url)
}

/// Calls OpenAI Chat Completions API and returns the assistant message content.
/// When json_response is true, requests response_format json_object.
async fn call_openai(
    api_key: &str,
    model: &str,
    user_message: &str,
    json_response: bool,
) -> Result<String, String> {
    let mut payload = serde_json::json!({
        "model": model,
        "messages": [{ "role": "user", "content": user_message }]
    });
    if json_response {
        payload["response_format"] = serde_json::json!({ "type": "json_object" });
    }

    let res = reqwest::Client::new()
        .post(OPENAI_CHAT_URL)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    let body_json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        let err_msg = body_json
            .get("error")
            .and_then(|e| e.get("message"))
            .and_then(|m| m.as_str())
            .unwrap_or("OpenAI API error");
        return Err(err_msg.to_string());
    }

    body_json
        .get("choices")
        .and_then(|c| c.as_array())
        .and_then(|a| a.first())
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .map(String::from)
        .ok_or_else(|| "Invalid OpenAI response".to_string())
}

#[derive(Serialize, FromRow)]
pub struct CitationResultRow {
    pub id: Uuid,
    pub citation_id: Uuid,
    pub query: String,
    pub response_text: Option<String>,
    pub citation_urls: Option<serde_json::Value>,
    pub mentioned_brands: Option<serde_json::Value>,
    pub your_product_mentioned: Option<bool>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn create_citation(
    Extension(pool): Extension<PgPool>,
    Json(body): Json<CreateCitationRequest>,
) -> Result<(axum::http::StatusCode, Json<CreateCitationResponse>), (axum::http::StatusCode, Json<serde_json::Value>)> {
    let company_name = body.company_name.trim();
    let website_url = body.website_url.trim();
    let product_description = body.product_description.trim();
    let custom_prompts = body.custom_prompts.as_ref().map(|p| {
        p.iter()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
    });

    let has_custom = custom_prompts.as_ref().map(|p| !p.is_empty()).unwrap_or(false);
    if company_name.is_empty() || website_url.is_empty() {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "company_name and website_url are required" })),
        ));
    }
    if !has_custom && product_description.is_empty() {
        return Err((
            axum::http::StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "product_description or custom_prompts are required" })),
        ));
    }

    let stored_desc = if has_custom {
        custom_prompts.as_ref().unwrap().first().cloned().unwrap_or_default()
    } else {
        product_description.to_string()
    };

    let run_search = body.run_search.unwrap_or(true);
    let status = if run_search { "running" } else { "completed" };

    let citation_id = Uuid::new_v4();
    sqlx::query(
        r#"INSERT INTO chatgpt_citations (id, company_name, website_url, product_description, status)
           VALUES ($1, $2, $3, $4, $5)"#,
    )
    .bind(citation_id)
    .bind(company_name)
    .bind(website_url)
    .bind(&stored_desc)
    .bind(status)
    .execute(&pool)
    .await
    .map_err(|e| {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
    })?;

    if run_search {
        let pool_clone = pool.clone();
        let company_name = company_name.to_string();
        let website_url = website_url.to_string();
        let product_description = product_description.to_string();
        let custom_prompts_clone = custom_prompts.clone();

        tokio::spawn(async move {
            run_citation_check(
                &pool_clone,
                citation_id,
                &company_name,
                &website_url,
                &product_description,
                custom_prompts_clone.as_deref(),
            )
            .await;
        });
    } else {
        let _ = sqlx::query(
            "UPDATE chatgpt_citations SET completed_at = NOW() WHERE id = $1",
        )
        .bind(citation_id)
        .execute(&pool)
        .await;
    }

    Ok((
        axum::http::StatusCode::ACCEPTED,
        Json(CreateCitationResponse { id: citation_id }),
    ))
}

pub async fn get_citation(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, Json<serde_json::Value>)> {
    let citation = sqlx::query_as::<_, (Uuid, String, String, String, String, chrono::DateTime<chrono::Utc>, Option<chrono::DateTime<chrono::Utc>>)>(
        r#"SELECT id, company_name, website_url, product_description, status, created_at, completed_at
           FROM chatgpt_citations WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
    })?
    .ok_or((
        axum::http::StatusCode::NOT_FOUND,
        Json(serde_json::json!({ "error": "Citation not found" })),
    ))?;

    let (cid, cname, curl, cdesc, cstatus, ccreated, ccompleted) = citation;

    let results = sqlx::query_as::<_, CitationResultRow>(
        r#"SELECT id, citation_id, query, response_text, citation_urls, mentioned_brands, your_product_mentioned, created_at
           FROM chatgpt_citation_results WHERE citation_id = $1 ORDER BY created_at"#,
    )
    .bind(id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
    })?;

    Ok(Json(serde_json::json!({
        "id": cid,
        "company_name": cname,
        "website_url": curl,
        "product_description": cdesc,
        "status": cstatus,
        "created_at": ccreated,
        "completed_at": ccompleted,
        "results": results
    })))
}

pub(crate) fn normalize_domain(url: &str) -> String {
    let url = url.trim().to_lowercase();
    let url = url.trim_start_matches("https://").trim_start_matches("http://");
    let url = url.trim_start_matches("www.");
    url.split('/').next().unwrap_or("").to_string()
}

fn extract_brands_from_text(text: &str) -> Vec<String> {
    let mut brands = Vec::new();
    let re = regex::Regex::new(r"(?i)\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)\b").ok();
    if let Some(re) = re {
        for cap in re.captures_iter(text) {
            let name = cap.get(1).map(|m| m.as_str().trim().to_string()).unwrap_or_default();
            if name.len() >= 2 && name.len() <= 50 && !brands.contains(&name) {
                brands.push(name);
            }
        }
    }
    brands.truncate(20);
    brands
}

async fn run_citation_check(
    pool: &PgPool,
    citation_id: Uuid,
    company_name: &str,
    website_url: &str,
    product_description: &str,
    custom_prompts: Option<&[String]>,
) {
    let api_key = match std::env::var("OPENAI_API_KEY") {
        Ok(k) if !k.is_empty() => k,
        _ => {
            let _ = sqlx::query("UPDATE chatgpt_citations SET status = 'failed', completed_at = NOW() WHERE id = $1")
                .bind(citation_id)
                .execute(pool)
            .await;
            return;
        }
    };

    let domain = normalize_domain(website_url);
    let queries: Vec<String> = if let Some(prompts) = custom_prompts {
        if prompts.is_empty() {
            vec![
                format!("What are the best {} tools or solutions? List specific companies and products with sources.", product_description),
                format!("Recommend {} for B2B. Which companies should I consider?", product_description),
                format!("Top {} products and vendors in 2024", product_description),
                format!("Compare {} solutions. Which ones are worth trying?", product_description),
                format!("I need {} for my business. What do you recommend?", product_description),
            ]
        } else {
            prompts.to_vec()
        }
    } else {
        vec![
            format!("What are the best {} tools or solutions? List specific companies and products with sources.", product_description),
            format!("Recommend {} for B2B. Which companies should I consider?", product_description),
            format!("Top {} products and vendors in 2024", product_description),
            format!("Compare {} solutions. Which ones are worth trying?", product_description),
            format!("I need {} for my business. What do you recommend?", product_description),
        ]
    };

    let client = reqwest::Client::new();

    // 1. Fetch all queries in parallel
    let fetch_futures = queries.iter().map(|query| {
        let client = client.clone();
        let api_key = api_key.clone();
        let query = query.clone();
        let domain = domain.clone();
        let company_name = company_name.to_string();
        async move {
            let payload = serde_json::json!({
                "model": "gpt-4o",
                "input": query,
                "tools": [{ "type": "web_search" }],
                "include": ["web_search_call.action.sources"]
            });

            let res = match client
                .post(OPENAI_RESPONSES_URL)
                .header("Authorization", format!("Bearer {}", api_key))
                .header("Content-Type", "application/json")
                .json(&payload)
                .send()
                .await
            {
                Ok(r) => r,
                Err(_) => return None,
            };

            let status = res.status().as_u16();
            let body: serde_json::Value = match res.json().await {
                Ok(b) => b,
                Err(_) => return None,
            };

            let (response_text, citation_urls, mentioned_brands, your_product_mentioned) =
                parse_openai_response(&body, &domain, &company_name);

            Some((query, response_text, citation_urls, mentioned_brands, your_product_mentioned, status))
        }
    });

    let results = join_all(fetch_futures).await;

    // 2. Insert results sequentially (avoids exhausting DB pool)
    for (idx, result) in results.into_iter().enumerate() {
        let Some((query, response_text, citation_urls, mentioned_brands, your_product_mentioned, status)) = result else {
            continue;
        };

        eprintln!("[citation] iteration {}: query={:?} citation_urls={:?}", idx, query, citation_urls);

        let citation_urls_json = serde_json::to_value(citation_urls).unwrap_or(serde_json::Value::Array(vec![]));
        let mentioned_brands_json = serde_json::to_value(mentioned_brands).unwrap_or(serde_json::Value::Array(vec![]));

        let _ = sqlx::query(
            r#"INSERT INTO chatgpt_citation_results (citation_id, query, response_text, citation_urls, mentioned_brands, your_product_mentioned)
               VALUES ($1, $2, $3, $4, $5, $6)"#,
        )
        .bind(citation_id)
        .bind(&query)
        .bind(response_text.as_deref())
        .bind(&citation_urls_json)
        .bind(&mentioned_brands_json)
        .bind(your_product_mentioned)
        .execute(pool)
        .await;

        if status >= 400 {
            break;
        }
    }

    let _ = sqlx::query("UPDATE chatgpt_citations SET status = 'completed', completed_at = NOW() WHERE id = $1")
        .bind(citation_id)
        .execute(pool)
    .await;
}

fn parse_openai_response(
    body: &serde_json::Value,
    domain: &str,
    company_name: &str,
) -> (Option<String>, Vec<String>, Vec<String>, bool) {
    let mut response_text = None;
    let mut citation_urls: Vec<String> = Vec::new();
    let mut mentioned_brands: Vec<String> = Vec::new();
    let mut your_product_mentioned = false;

    let output = body.get("output").and_then(|o| o.as_array());
    let output = match output {
        Some(o) => o,
        None => return (None, vec![], vec![], false),
    };

    for item in output {
        if item.get("type").and_then(|t| t.as_str()) == Some("message") {
            let content = item.get("content").and_then(|c| c.as_array());
            if let Some(content) = content {
                for block in content {
                    if let Some(text) = block.get("text").and_then(|t| t.as_str()) {
                        response_text = Some(text.to_string());
                        let brands = extract_brands_from_text(text);
                        for b in brands {
                            if !mentioned_brands.contains(&b) {
                                mentioned_brands.push(b);
                            }
                        }
                        if text.to_lowercase().contains(&company_name.to_lowercase()) {
                            your_product_mentioned = true;
                        }
                    }
                    if let Some(annotations) = block.get("annotations").and_then(|a| a.as_array()) {
                        for ann in annotations {
                            if ann.get("type").and_then(|t| t.as_str()) == Some("url_citation") {
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
            }
        }
        if item.get("type").and_then(|t| t.as_str()) == Some("web_search_call") {
            if let Some(action) = item.get("action") {
                if let Some(sources) = action.get("sources").and_then(|s| s.as_array()) {
                    for source in sources {
                        if source.get("type").and_then(|t| t.as_str()) == Some("url") {
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
                }
            }
        }
    }

    eprintln!("[citation] parse_openai_response: citation_urls count = {}", citation_urls.len());
    for (i, url) in citation_urls.iter().enumerate() {
        eprintln!("[citation] citation_urls[{}] = {}", i, url);
    }
    (response_text, citation_urls, mentioned_brands, your_product_mentioned)
}

#[cfg(test)]
mod tests {
    use super::{normalize_domain, normalize_url_for_scrape};

    #[test]
    fn test_normalize_url_for_scrape_bare_domain() {
        assert_eq!(normalize_url_for_scrape("example.com"), "https://example.com");
    }

    #[test]
    fn test_normalize_url_for_scrape_http() {
        assert_eq!(
            normalize_url_for_scrape("http://example.com"),
            "https://example.com"
        );
    }

    #[test]
    fn test_normalize_url_for_scrape_https_unchanged() {
        assert_eq!(
            normalize_url_for_scrape("https://example.com"),
            "https://example.com"
        );
    }

    #[test]
    fn test_normalize_url_for_scrape_trimmed() {
        assert_eq!(
            normalize_url_for_scrape("  example.com  "),
            "https://example.com"
        );
    }

    #[test]
    fn test_normalize_domain_full_url() {
        assert_eq!(
            normalize_domain("https://www.example.com/path"),
            "example.com"
        );
    }

    #[test]
    fn test_normalize_domain_http() {
        assert_eq!(normalize_domain("http://example.com"), "example.com");
    }

    #[test]
    fn test_normalize_domain_www() {
        assert_eq!(normalize_domain("www.example.com"), "example.com");
    }
}
