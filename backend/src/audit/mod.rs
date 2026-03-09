pub mod citation;
pub mod crawl;
pub mod insight;
pub mod models;

use axum::{extract::Path, Extension, Json};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateAuditRequest {
    pub store_id: String,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct Audit {
    pub id: Uuid,
    pub store_id: Uuid,
    pub status: String,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct AuditResult {
    pub id: Uuid,
    pub audit_id: Uuid,
    pub product_id: Option<String>,
    pub product_title: Option<String>,
    pub scores: Option<serde_json::Value>,
    pub recommendations: Option<serde_json::Value>,
    pub raw_data: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

fn get_org_id_from_header(
    headers: &axum::http::HeaderMap,
) -> Result<String, (axum::http::StatusCode, Json<serde_json::Value>)> {
    headers
        .get("X-Internal-Org-Id")
        .and_then(|v| v.to_str().ok())
        .map(String::from)
        .ok_or((
            axum::http::StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Org required" })),
        ))
}

pub async fn create_audit(
    Extension(pool): Extension<PgPool>,
    headers: axum::http::HeaderMap,
    Json(body): Json<CreateAuditRequest>,
) -> Result<Json<Audit>, (axum::http::StatusCode, Json<serde_json::Value>)> {
    let org_id = get_org_id_from_header(&headers)?;

    let store_id = Uuid::parse_str(&body.store_id).map_err(|_| {
        (
            axum::http::StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Invalid store_id" })),
        )
    })?;

    let store = sqlx::query!(
        "SELECT id, config, platform FROM stores WHERE id = $1 AND org_id = $2",
        store_id,
        org_id
    )
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
        Json(serde_json::json!({ "error": "Store not found" })),
    ))?;

    let audit_id = Uuid::new_v4();
    sqlx::query!(
        "INSERT INTO audits (id, store_id, status) VALUES ($1, $2, 'running')",
        audit_id,
        store_id
    )
    .execute(&pool)
    .await
    .map_err(|e| {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
    })?;

    let pool_clone = pool.clone();
    let config = store.config.clone();
    let platform = store.platform.clone();

    tokio::spawn(async move {
        run_audit(&pool_clone, audit_id, config, platform).await;
    });

    let audit = sqlx::query_as!(
        Audit,
        "SELECT id, store_id, status, started_at, completed_at, created_at FROM audits WHERE id = $1",
        audit_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
    })?;

    Ok(Json(audit))
}

pub async fn get_audit(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<Uuid>,
    headers: axum::http::HeaderMap,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, Json<serde_json::Value>)> {
    let org_id = get_org_id_from_header(&headers)?;

    let audit = sqlx::query!(
        r#"SELECT a.id, a.store_id, a.status, a.started_at, a.completed_at, a.created_at, s.config as "store_config"
           FROM audits a JOIN stores s ON a.store_id = s.id
           WHERE a.id = $1 AND s.org_id = $2"#,
        id,
        org_id
    )
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
        Json(serde_json::json!({ "error": "Audit not found" })),
    ))?;

    let results = sqlx::query_as!(
        AuditResult,
        "SELECT id, audit_id, product_id, product_title, scores, recommendations, raw_data, created_at FROM audit_results WHERE audit_id = $1 ORDER BY created_at",
        id
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
    })?;

    Ok(Json(serde_json::json!({
        "id": audit.id,
        "store_id": audit.store_id,
        "status": audit.status,
        "started_at": audit.started_at,
        "completed_at": audit.completed_at,
        "created_at": audit.created_at,
        "store_config": audit.store_config,
        "results": results
    })))
}

async fn run_audit(
    pool: &PgPool,
    audit_id: Uuid,
    config: serde_json::Value,
    platform: String,
) {
    let base_url = config
        .get("baseUrl")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let store_config = models::StoreConfig {
        base_url,
        platform: platform.clone(),
    };

    let firecrawl_key = std::env::var("FIRECRAWL_API_KEY").ok();
    let products = crawl::crawl_store(&store_config, firecrawl_key).await;

    for product in products {
        let scores = insight::score_product(&product);
        let scores_json = serde_json::json!({
            "dataQuality": scores.data_quality,
            "agentFriendliness": scores.agent_friendliness
        });
        let recommendations_json =
            serde_json::to_value(scores.recommendations).unwrap_or(serde_json::Value::Array(vec![]));
        let raw_data = serde_json::to_value(&product).ok();

        let _ = sqlx::query!(
            r#"INSERT INTO audit_results (audit_id, product_id, product_title, scores, recommendations, raw_data)
               VALUES ($1, $2, $3, $4, $5, $6)"#,
            audit_id,
            product.id,
            product.title,
            scores_json,
            recommendations_json,
            raw_data
        )
        .execute(pool)
        .await;
    }

    let _ = sqlx::query!(
        "UPDATE audits SET status = 'completed', completed_at = NOW() WHERE id = $1",
        audit_id
    )
    .execute(pool)
    .await;
}
