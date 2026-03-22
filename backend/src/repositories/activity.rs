use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::activity::AgentActivity;

pub async fn create(
  pool: &PgPool,
  org_id: &str,
  store_id: Option<Uuid>,
  agent_name: &str,
  action_type: &str,
  payload: Option<Value>,
) -> Result<AgentActivity, sqlx::Error> {
  sqlx::query_as::<_, AgentActivity>(
    r#"INSERT INTO agent_activity (org_id, store_id, agent_name, action_type, payload)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, org_id, store_id, agent_name, action_type, payload, created_at"#,
  )
  .bind(org_id)
  .bind(store_id)
  .bind(agent_name.trim())
  .bind(action_type.trim())
  .bind(payload)
  .fetch_one(pool)
  .await
}

pub async fn update(
  pool: &PgPool,
  org_id: &str,
  id: Uuid,
  agent_name: Option<String>,
  payload: Option<Value>,
) -> Result<Option<AgentActivity>, sqlx::Error> {
  let agent_name = agent_name.map(|s| s.trim().to_string()).filter(|s| !s.is_empty());

  sqlx::query_as::<_, AgentActivity>(
    r#"UPDATE agent_activity
       SET agent_name = COALESCE($3, agent_name),
           payload = COALESCE($4, payload)
       WHERE id = $1 AND org_id = $2
       RETURNING id, org_id, store_id, agent_name, action_type, payload, created_at"#,
  )
  .bind(id)
  .bind(org_id)
  .bind(agent_name)
  .bind(payload)
  .fetch_optional(pool)
  .await
}

pub async fn delete(pool: &PgPool, org_id: &str, id: Uuid) -> Result<bool, sqlx::Error> {
  let done = sqlx::query("DELETE FROM agent_activity WHERE id = $1 AND org_id = $2")
    .bind(id)
    .bind(org_id)
    .execute(pool)
    .await?;
  Ok(done.rows_affected() > 0)
}

#[cfg(test)]
mod tests {
  use super::*;

  async fn seed_org(pool: &PgPool, org_id: &str) {
    sqlx::query("INSERT INTO organizations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING")
      .bind(org_id)
      .execute(pool)
      .await
      .expect("seed org");
  }

  #[sqlx::test(migrations = "../migrations")]
  async fn create_update_delete_activity(pool: PgPool) {
    seed_org(&pool, "org-activity").await;

    let created = create(
      &pool,
      "org-activity",
      None,
      "agent-a",
      "citation_geo_sentiment",
      Some(serde_json::json!({ "key": "value" })),
    )
    .await
    .expect("create activity");
    assert_eq!(created.org_id, "org-activity");
    assert_eq!(created.agent_name, "agent-a");

    let updated = update(
      &pool,
      "org-activity",
      created.id,
      Some("agent-b".to_string()),
      Some(serde_json::json!({ "updated": true })),
    )
    .await
    .expect("update activity")
    .expect("activity exists");
    assert_eq!(updated.agent_name, "agent-b");
    assert_eq!(updated.payload, Some(serde_json::json!({ "updated": true })));

    let deleted = delete(&pool, "org-activity", created.id).await.expect("delete activity");
    assert!(deleted);

    let maybe = sqlx::query_scalar::<_, Uuid>("SELECT id FROM agent_activity WHERE id = $1")
      .bind(created.id)
      .fetch_optional(&pool)
      .await
      .expect("query activity");
    assert!(maybe.is_none());
  }

  #[sqlx::test(migrations = "../migrations")]
  async fn wrong_org_cannot_update_or_delete(pool: PgPool) {
    seed_org(&pool, "org-right").await;
    seed_org(&pool, "org-wrong").await;

    let created = create(
      &pool,
      "org-right",
      None,
      "agent-a",
      "citation_geo_sentiment",
      None,
    )
    .await
    .expect("create activity");

    let updated = update(
      &pool,
      "org-wrong",
      created.id,
      Some("agent-hijack".to_string()),
      None,
    )
    .await
    .expect("update should succeed with none");
    assert!(updated.is_none());

    let deleted = delete(&pool, "org-wrong", created.id).await.expect("delete call");
    assert!(!deleted);
  }
}
