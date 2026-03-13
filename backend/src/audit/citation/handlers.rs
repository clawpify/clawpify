use axum::{extract::Path, http::HeaderMap, Extension, Json};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::error::{self, ApiError};
use crate::llm;
use crate::rate_limit;

use super::parsing;
use super::prompts;
use super::urls;

const RATE_LIMIT_MESSAGE: &str =
  "Rate limit exceeded. Free tier: 2 audits per 2 days. Sign in for more.";

/// Enforces rate limit for unauthenticated requests. Logged-in users (with
/// `X-Internal-User-Id`) bypass. Returns `Err` with 429 if limit exceeded.
async fn enforce_rate_limit(
  headers: &HeaderMap,
  rate_limit_pool: Option<&PgPool>,
) -> Result<(), ApiError> {
  if headers.get("X-Internal-User-Id").is_some() {
    return Ok(());
  }
  let Some(rl_pool) = rate_limit_pool else {
    return Ok(());
  };
  let ip = headers
    .get("X-Client-IP")
    .and_then(|v| v.to_str().ok())
    .unwrap_or("unknown");
  let allowed = rate_limit::check_and_record(rl_pool, ip)
    .await
    .map_err(error::db_error)?;
  if allowed {
    Ok(())
  } else {
    Err(error::rate_limit_exceeded(RATE_LIMIT_MESSAGE))
  }
}

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

fn resolve_stored_description(
  custom_prompts: Option<&Vec<String>>,
  product_description: &str,
) -> String {
  custom_prompts
    .as_ref()
    .filter(|p| !p.is_empty())
    .and_then(|p| p.first().cloned())
    .unwrap_or_else(|| product_description.to_string())
}

#[derive(Deserialize)]
pub struct GenerateRequest {
  pub company_name: String,
  pub website_url: String,
  #[serde(default)]
  pub website_content: Option<String>,
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

/// Generates search prompts and competitor list from company info and website content.
pub async fn generate_prompts_and_competitors(
  Json(body): Json<GenerateRequest>,
) -> Result<Json<GenerateResponse>, ApiError> {
  let company_name = body.company_name.trim();
  let website_url = body.website_url.trim();

  if company_name.is_empty() || website_url.is_empty() {
    return Err(error::bad_request(
      "company_name and website_url are required",
    ));
  }

  urls::validate_url(website_url).map_err(|e| error::bad_request(&e))?;

  let provider = llm::citation_provider()
    .ok_or_else(|| error::service_unavailable("No LLM provider configured"))?;

  let md = body.website_content.clone();

  let gist: Option<String> = if let Some(md) = md {
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
  let content = result.text;

  let parsed: serde_json::Value = serde_json::from_str(&content)
    .map_err(|e| error::bad_gateway(format!("Failed to parse AI response: {}", e)))?;

  let prompts_vec = extract_string_array(&parsed, "prompts");
  let competitors = extract_string_array(&parsed, "competitors");

  Ok(Json(GenerateResponse {
    prompts: prompts_vec,
    competitors,
  }))
}

/// Creates a citation check job and optionally starts the search.
pub async fn create_citation(
  Extension(pool): Extension<PgPool>,
  Extension(rate_limit_pool): Extension<Option<PgPool>>,
  headers: HeaderMap,
  Json(body): Json<CreateCitationRequest>,
) -> Result<(axum::http::StatusCode, Json<CreateCitationResponse>), ApiError> {
  enforce_rate_limit(&headers, rate_limit_pool.as_ref()).await?;

  let company_name = body.company_name.trim();
  let website_url = body.website_url.trim();
  let product_description = body.product_description.trim();
  let custom_prompts = body.custom_prompts.as_ref().map(|p| {
    p.iter()
      .map(|s| s.trim().to_string())
      .filter(|s| !s.is_empty())
      .collect::<Vec<_>>()
  });

  let has_custom = custom_prompts
    .as_ref()
    .map(|p| !p.is_empty())
    .unwrap_or(false);
  if company_name.is_empty() || website_url.is_empty() {
    return Err(error::bad_request(
      "company_name and website_url are required",
    ));
  }
  if !has_custom && product_description.is_empty() {
    return Err(error::bad_request(
      "product_description or custom_prompts are required",
    ));
  }

  urls::validate_url(website_url).map_err(|e| error::bad_request(&e))?;

  let stored_desc = resolve_stored_description(custom_prompts.as_ref(), product_description);

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
  .map_err(error::db_error)?;

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
    let _ = sqlx::query("UPDATE chatgpt_citations SET completed_at = NOW() WHERE id = $1")
      .bind(citation_id)
      .execute(&pool)
      .await;
  }

  Ok((
    axum::http::StatusCode::ACCEPTED,
    Json(CreateCitationResponse { id: citation_id }),
  ))
}

/// Fetches a citation by ID with its results.
pub async fn get_citation(
  Extension(pool): Extension<PgPool>,
  Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
  let citation = sqlx::query_as::<
    _,
    (
      Uuid,
      String,
      String,
      String,
      String,
      chrono::DateTime<chrono::Utc>,
      Option<chrono::DateTime<chrono::Utc>>,
    ),
  >(
    r#"SELECT id, company_name, website_url, product_description, status, created_at, completed_at
           FROM chatgpt_citations WHERE id = $1"#,
  )
  .bind(id)
  .fetch_optional(&pool)
  .await
  .map_err(error::db_error)?
  .ok_or_else(|| error::not_found("Citation not found"))?;

  let (cid, cname, curl, cdesc, cstatus, ccreated, ccompleted) = citation;

  let results = sqlx::query_as::<_, CitationResultRow>(
        r#"SELECT id, citation_id, query, response_text, citation_urls, mentioned_brands, your_product_mentioned, created_at
           FROM chatgpt_citation_results WHERE citation_id = $1 ORDER BY created_at"#,
    )
    .bind(id)
    .fetch_all(&pool)
    .await
    .map_err(error::db_error)?;

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

async fn run_citation_check(
  pool: &PgPool,
  citation_id: Uuid,
  company_name: &str,
  website_url: &str,
  product_description: &str,
  custom_prompts: Option<&[String]>,
) {
  let provider = match llm::citation_provider() {
    Some(p) => p,
    None => {
      let _ = sqlx::query(
        "UPDATE chatgpt_citations SET status = 'failed', completed_at = NOW() WHERE id = $1",
      )
      .bind(citation_id)
      .execute(pool)
      .await;
      return;
    }
  };

  let domain = urls::normalize_domain(website_url);
  let queries = prompts::build_queries(product_description, custom_prompts);
  let opts = llm::CompleteOptions::default().with_web_search(true);

  let mut handles = Vec::with_capacity(queries.len());
  for query in queries.iter() {
    let pool = pool.clone();
    let citation_id = citation_id;
    let provider = std::sync::Arc::clone(&provider);
    let domain = domain.clone();
    let company_name = company_name.to_string();
    let query = query.clone();
    let opts = opts.clone();

    handles.push(tokio::spawn(async move {
      let result = match llm::run_single_provider(&provider, &query, &opts).await {
        Ok(r) => r,
        Err(_) => return,
      };

      let (response_text, citation_urls, mentioned_brands, your_product_mentioned) =
        if let Some(ref raw) = result.raw {
          parsing::parse_openai_response(raw, &domain, &company_name)
        } else {
          let brands = parsing::extract_brands_from_text(&result.text);
          (Some(result.text), vec![], brands, false)
        };

      let citation_urls_json =
        serde_json::to_value(citation_urls).unwrap_or(serde_json::Value::Array(vec![]));
      let mentioned_brands_json =
        serde_json::to_value(mentioned_brands).unwrap_or(serde_json::Value::Array(vec![]));

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
      .execute(&pool)
      .await;
    }));
  }

  for h in handles {
    let _ = h.await;
  }

  let _ = sqlx::query(
    "UPDATE chatgpt_citations SET status = 'completed', completed_at = NOW() WHERE id = $1",
  )
  .bind(citation_id)
  .execute(pool)
  .await;
}
