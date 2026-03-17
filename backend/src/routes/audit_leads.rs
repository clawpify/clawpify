use axum::{routing::post, Extension, Json, Router};
use sqlx::PgPool;

use crate::dto::audit_lead::{AuditLeadRequest, AuditLeadResponse};
use crate::error::{self, ApiError};

pub fn routes() -> Router<()> {
  Router::new().route("/audit-leads", post(submit_lead))
}

async fn submit_lead(
  Extension(pool): Extension<PgPool>,
  Json(body): Json<AuditLeadRequest>,
) -> Result<Json<AuditLeadResponse>, ApiError> {
  let name = body.name.trim();
  let email = body.email.trim().to_lowercase();

  if name.is_empty() {
    return Err(error::bad_request("Name is required"));
  }
  if email.is_empty() {
    return Err(error::bad_request("Email is required"));
  }
  if !email.contains('@') {
    return Err(error::bad_request("Invalid email"));
  }

  let organization = body.organization.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty());
  let interest = body
    .interest
    .as_ref()
    .map(|s| s.trim())
    .filter(|s| !s.is_empty());

  sqlx::query(
    r#"INSERT INTO audit_leads (name, organization, email, newsletter_opt_in, interest)
       VALUES ($1, $2, $3, $4, $5)"#,
  )
  .bind(name)
  .bind(organization)
  .bind(&email)
  .bind(body.newsletter_opt_in)
  .bind(interest)
  .execute(&pool)
  .await
  .map_err(error::db_error)?;

  Ok(Json(AuditLeadResponse { ok: true }))
}
