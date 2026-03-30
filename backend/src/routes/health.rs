use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use utoipa::OpenApi;

use super::state::AppState;

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct HealthResponse {
  pub ok: bool,
  pub service: &'static str,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub database: Option<&'static str>,
}

#[utoipa::path(
  get,
  path = "/health",
  tag = "meta",
  responses(
    (status = 200, description = "Service is healthy", body = HealthResponse),
    (status = 503, description = "Database check failed", body = HealthResponse)
  )
)]
pub async fn health_check(State(state): State<AppState>) -> (StatusCode, Json<HealthResponse>) {
  let db_ok = sqlx::query_scalar::<_, i32>("SELECT 1")
    .fetch_one(&state.pool)
    .await
    .is_ok();

  if db_ok {
    (
      StatusCode::OK,
      Json(HealthResponse {
        ok: true,
        service: "clawpify-backend",
        database: Some("up"),
      }),
    )
  } else {
    (
      StatusCode::SERVICE_UNAVAILABLE,
      Json(HealthResponse {
        ok: false,
        service: "clawpify-backend",
        database: Some("down"),
      }),
    )
  }
}

#[derive(utoipa::OpenApi)]
#[openapi(
  info(
    title = "Clawpify API",
    version = "1.0.0",
    description = "Versioned HTTP API. Authenticated routes expect internal proxy headers (`X-Internal-User-Id`, `X-Internal-Org-Id`). Integration webhooks use their own verification."
  ),
  paths(health_check),
  components(schemas(HealthResponse)),
  tags(
    (name = "meta", description = "Health and API metadata"),
  ),
  servers((url = "/api/v1", description = "API version 1")),
)]
pub struct ApiDoc;

pub fn openapi_spec() -> utoipa::openapi::OpenApi {
  ApiDoc::openapi()
}

pub fn routes() -> Router<AppState> {
  Router::new().route("/health", get(health_check))
}
