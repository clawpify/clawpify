use serde::Serialize;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Organization {
  /* id of the organization */
  pub id: String,
  /* name of the organization */
  pub name: Option<String>,
  /* slug of the organization */
  pub slug: Option<String>,
  /* created at */
  pub created_at: chrono::DateTime<chrono::Utc>,
}
