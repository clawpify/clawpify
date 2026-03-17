use axum::{extract::Path, http::HeaderMap, middleware, routing::{get, post}, Extension, Json, Router};
use sqlx::PgPool;
use std::collections::HashMap;
use uuid::Uuid;

use crate::dto::citation::*;
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::models::citation::*;
use crate::rate_limit;
use crate::services::citation::{generate, runner, urls};

const RATE_LIMIT_MESSAGE: &str =
  "Rate limit exceeded. Free tier: 2 audits per day. Sign in for more.";

pub fn routes() -> Router<()> {
  let protected = Router::new()
    .route("/citations", get(list_citations_by_org))
    .route_layer(middleware::from_fn(mw::require_internal_auth));

  Router::new()
    .route("/chatgpt-citation/generate", post(generate_prompts))
    .route("/chatgpt-citation", post(create_citation))
    .route("/chatgpt-citation/:id", get(get_citation))
    .merge(protected)
}

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

struct CreateCitationBehavior {
  status: &'static str,
  should_start_analysis: bool,
}

fn create_citation_behavior(_requested_run_search: Option<bool>) -> CreateCitationBehavior {
  CreateCitationBehavior {
    status: "running",
    should_start_analysis: true,
  }
}

fn derive_company_name(website_url: &str) -> String {
  let host = url::Url::parse(website_url)
    .ok()
    .and_then(|url| url.host_str().map(str::to_owned))
    .or_else(|| {
      url::Url::parse(&format!("https://{website_url}"))
        .ok()
        .and_then(|url| url.host_str().map(str::to_owned))
    })
    .unwrap_or_default();

  let normalized = host
    .strip_prefix("www.")
    .unwrap_or(&host)
    .split('.')
    .next()
    .unwrap_or("")
    .replace(['-', '_'], " ");

  normalized
    .split_whitespace()
    .map(|word| {
      let mut chars = word.chars();
      match chars.next() {
        Some(first) => format!("{}{}", first.to_uppercase(), chars.as_str().to_lowercase()),
        None => String::new(),
      }
    })
    .collect::<Vec<_>>()
    .join(" ")
}

async fn generate_prompts(
  Json(body): Json<GenerateRequest>,
) -> Result<Json<GenerateResponse>, ApiError> {
  let derived_company_name = derive_company_name(body.website_url.trim());
  let company_name = if body.company_name.trim().is_empty() {
    derived_company_name.as_str()
  } else {
    body.company_name.trim()
  };
  let website_url = body.website_url.trim();

  if website_url.is_empty() {
    return Err(error::bad_request("website_url is required"));
  }
  if company_name.is_empty() {
    return Err(error::bad_request("company_name could not be derived from website_url"));
  }

  let result = generate::generate_prompts_and_competitors(
    company_name,
    website_url,
    body.website_content.clone(),
  )
  .await?;

  Ok(Json(result))
}

async fn create_citation(
  Extension(pool): Extension<PgPool>,
  Extension(rate_limit_pool): Extension<Option<PgPool>>,
  headers: HeaderMap,
  Json(body): Json<CreateCitationRequest>,
) -> Result<(axum::http::StatusCode, Json<CreateCitationResponse>), ApiError> {
  enforce_rate_limit(&headers, rate_limit_pool.as_ref()).await?;

  let website_url = body.website_url.trim();
  let derived_company_name = derive_company_name(website_url);
  let company_name = if body.company_name.trim().is_empty() {
    derived_company_name.as_str()
  } else {
    body.company_name.trim()
  };
  let product_description = body.product_description.trim();
  let custom_prompts = body.custom_prompts.as_ref().map(|p| {
    p.iter()
      .map(|s| s.trim().to_string())
      .filter(|s| !s.is_empty())
      .collect::<Vec<_>>()
  });

  let has_custom = custom_prompts.as_ref().map(|p| !p.is_empty()).unwrap_or(false);
  if website_url.is_empty() {
    return Err(error::bad_request("website_url is required"));
  }
  if company_name.is_empty() {
    return Err(error::bad_request("company_name could not be derived from website_url"));
  }
  if !has_custom && product_description.is_empty() {
    return Err(error::bad_request("product_description or custom_prompts are required"));
  }

  urls::validate_url(website_url).map_err(|e| error::bad_request(&e))?;

  let stored_desc = resolve_stored_description(custom_prompts.as_ref(), product_description);
  let behavior = create_citation_behavior(body.run_search);

  let org_id: Option<String> = headers
    .get("X-Internal-Org-Id")
    .and_then(|v| v.to_str().ok())
    .map(String::from);

  let citation_id = Uuid::new_v4();

  sqlx::query(
    r#"INSERT INTO chatgpt_citations (id, company_name, website_url, product_description, status, org_id)
       VALUES ($1, $2, $3, $4, $5, $6)"#,
  )
  .bind(citation_id)
  .bind(company_name)
  .bind(website_url)
  .bind(&stored_desc)
  .bind(behavior.status)
  .bind(org_id.as_deref())
  .execute(&pool)
  .await
  .map_err(error::db_error)?;

  if behavior.should_start_analysis {
    let pool_clone = pool.clone();
    let company_name = company_name.to_string();
    let website_url = website_url.to_string();
    let product_description = product_description.to_string();
    let custom_prompts_clone = custom_prompts.clone();
    let org_id_for_task = org_id.clone();

    tokio::spawn(async move {
      runner::run_citation_check(
        &pool_clone,
        citation_id,
        &company_name,
        &website_url,
        &product_description,
        custom_prompts_clone.as_deref(),
        org_id_for_task.as_deref(),
      )
      .await;
    });
  }

  Ok((
    axum::http::StatusCode::ACCEPTED,
    Json(CreateCitationResponse { id: citation_id }),
  ))
}

async fn get_citation(
  Extension(pool): Extension<PgPool>,
  Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
  let citation = sqlx::query_as::<_, CitationRow>(
    r#"SELECT id, company_name, website_url, product_description, status, created_at, completed_at
       FROM chatgpt_citations WHERE id = $1"#,
  )
  .bind(id)
  .fetch_optional(&pool)
  .await
  .map_err(error::db_error)?
  .ok_or_else(|| error::not_found("Citation not found"))?;

  let results = sqlx::query_as::<_, CitationResultRow>(
    r#"SELECT id, citation_id, query, response_text, citation_urls, mentioned_brands, your_product_mentioned, provider, created_at
       FROM chatgpt_citation_results WHERE citation_id = $1 ORDER BY created_at"#,
  )
  .bind(id)
  .fetch_all(&pool)
  .await
  .map_err(error::db_error)?;

  Ok(Json(serde_json::json!({
      "id": citation.id,
      "company_name": citation.company_name,
      "website_url": citation.website_url,
      "product_description": citation.product_description,
      "status": citation.status,
      "created_at": citation.created_at,
      "completed_at": citation.completed_at,
      "results": results
  })))
}

async fn list_citations_by_org(
  Extension(pool): Extension<PgPool>,
  headers: HeaderMap,
) -> Result<Json<ListCitationsResponse>, ApiError> {
  let org_id = crate::auth::get_org_id(&headers)?;

  let citations = sqlx::query_as::<_, CitationSummaryRow>(
    r#"SELECT id, company_name, website_url, status, created_at, completed_at
       FROM chatgpt_citations
       WHERE org_id = $1
       ORDER BY created_at DESC
       LIMIT 50"#,
  )
  .bind(&org_id)
  .fetch_all(&pool)
  .await
  .map_err(error::db_error)?;

  let mut out = Vec::with_capacity(citations.len());
  for row in citations {
    let results = sqlx::query_as::<_, (Option<String>, Option<bool>)>(
      r#"SELECT provider, your_product_mentioned
         FROM chatgpt_citation_results
         WHERE citation_id = $1"#,
    )
    .bind(row.id)
    .fetch_all(&pool)
    .await
    .map_err(error::db_error)?;

    let mut by_provider: HashMap<String, (u32, u32)> = HashMap::new();
    for (provider, mentioned) in results {
      let provider = provider.unwrap_or_else(|| "unknown".to_string());
      let (total, mentioned_count) = by_provider.entry(provider).or_insert((0, 0));
      *total += 1;
      if mentioned == Some(true) {
        *mentioned_count += 1;
      }
    }

    let visibility_by_provider = by_provider
      .into_iter()
      .map(|(k, (total, mentioned))| {
        let visibility_pct = if total > 0 { (mentioned * 100) / total } else { 0 };
        (k, VisibilityByProvider { total, mentioned, visibility_pct })
      })
      .collect();

    out.push(CitationWithVisibility {
      id: row.id,
      company_name: row.company_name,
      website_url: row.website_url,
      status: row.status,
      created_at: row.created_at,
      completed_at: row.completed_at,
      visibility_by_provider,
    });
  }

  Ok(Json(ListCitationsResponse { citations: out }))
}

#[cfg(test)]
mod tests {
  use super::create_citation_behavior;

  #[test]
  fn create_citation_starts_analysis_when_run_search_is_false() {
    let behavior = create_citation_behavior(Some(false));
    assert_eq!(behavior.status, "running");
    assert!(behavior.should_start_analysis);
  }

  #[test]
  fn create_citation_starts_analysis_when_run_search_is_missing() {
    let behavior = create_citation_behavior(None);
    assert_eq!(behavior.status, "running");
    assert!(behavior.should_start_analysis);
  }
}
