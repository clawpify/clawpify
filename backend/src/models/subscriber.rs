use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Subscriber {
  /* id of the subscriber */
  pub id: Uuid,
  /* email of the subscriber */
  pub email: String,
  /* created at */
  pub created_at: chrono::DateTime<chrono::Utc>,
}
