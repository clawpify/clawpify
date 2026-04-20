use chrono::{DateTime, Utc};
use serde::Serialize;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Organization {
  pub id: String,                               // id
  pub name: Option<String>,                     // name
  pub slug: Option<String>,                     // slug
  pub created_at: DateTime<Utc>,                // created at
}
