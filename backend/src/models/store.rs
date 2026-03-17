use serde::Serialize;
use uuid::Uuid;

#[derive(Serialize, sqlx::FromRow)]
pub struct Store {
  pub id: Uuid,
  pub org_id: String,
  pub platform: String,
  pub config: serde_json::Value,
  pub created_at: chrono::DateTime<chrono::Utc>,
}
