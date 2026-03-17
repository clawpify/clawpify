use sqlx::PgPool;
use tokio::time::{timeout, Duration};
use uuid::Uuid;

use crate::llm;

use super::parsing;
use super::prompts;
use super::urls;

pub async fn run_citation_check(
  pool: &PgPool,
  citation_id: Uuid,
  company_name: &str,
  website_url: &str,
  product_description: &str,
  custom_prompts: Option<&[String]>,
  _org_id: Option<&str>,
) {
  let providers: Vec<_> = llm::default_providers()
    .into_iter()
    .filter(|p| {
      let n = p.name().to_lowercase();
      ["perplexity", "gemini", "openai"].contains(&n.as_str())
    })
    .collect();

  if providers.is_empty() {
    let _ = sqlx::query(
      "UPDATE chatgpt_citations SET status = 'failed', completed_at = NOW() WHERE id = $1",
    )
    .bind(citation_id)
    .execute(pool)
    .await;
    return;
  }

  let domain = urls::normalize_domain(website_url);
  let queries = prompts::build_queries(product_description, custom_prompts);
  let opts = llm::CompleteOptions::default().with_web_search(true);

  let mut handles = Vec::with_capacity(queries.len() * providers.len());
  for query in queries.iter() {
    for provider in &providers {
      let pool = pool.clone();
      let provider = std::sync::Arc::clone(provider);
      let domain = domain.clone();
      let company_name = company_name.to_string();
      let query = query.clone();
      let opts = opts.clone();
      let provider_name = provider.name().to_string();

      handles.push(tokio::spawn(async move {
        let result = match timeout(
          Duration::from_secs(60),
          provider.complete(&query, &opts),
        )
        .await
        {
          Ok(Ok(r)) => r,
          _ => return,
        };
        process_provider_result(&pool, citation_id, &query, &provider_name, result, &domain, &company_name).await;
      }));
    }
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

async fn process_provider_result(
  pool: &PgPool,
  citation_id: Uuid,
  query: &str,
  provider_name: &str,
  result: llm::CompleteResult,
  domain: &str,
  company_name: &str,
) {
  let (response_text, citation_urls, mentioned_brands, your_product_mentioned) =
    if let Some(ref raw) = result.raw {
      parsing::parse_openai_response(raw, domain, company_name)
    } else {
      let brands = parsing::extract_brands_from_text(&result.text);
      (Some(result.text), vec![], brands, false)
    };

  let citation_urls_json =
    serde_json::to_value(citation_urls).unwrap_or(serde_json::Value::Array(vec![]));
  let mentioned_brands_json =
    serde_json::to_value(mentioned_brands).unwrap_or(serde_json::Value::Array(vec![]));

  let _ = sqlx::query(
    r#"INSERT INTO chatgpt_citation_results (citation_id, query, response_text, citation_urls, mentioned_brands, your_product_mentioned, provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7)"#,
  )
  .bind(citation_id)
  .bind(query)
  .bind(response_text.as_deref())
  .bind(&citation_urls_json)
  .bind(&mentioned_brands_json)
  .bind(your_product_mentioned)
  .bind(provider_name)
  .execute(pool)
  .await;
}
