use super::state::AppState;
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};

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
  paths(health_check),
  components(schemas(HealthResponse)),
  tags((name = "meta", description = "Health and API metadata"))
)]
pub struct HealthOpenApiDoc;

pub fn routes() -> Router<AppState> {
  Router::new().route("/health", get(health_check))
}
