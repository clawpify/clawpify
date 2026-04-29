use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Subscriber {
  pub id: Uuid,                  // id
  pub email: String,             // email
  pub created_at: DateTime<Utc>, // created at
}
