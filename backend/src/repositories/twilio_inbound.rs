use sqlx::PgPool;

/// Records Twilio `MessageSid` for idempotent webhook handling. Returns `true` if newly inserted.
pub async fn try_record_message_sid(
  pool: &PgPool,
  message_sid: &str,
  org_id: &str,
) -> Result<bool, sqlx::Error> {
  let res = sqlx::query(
    r#"
    INSERT INTO twilio_inbound_message_ids (message_sid, org_id)
    VALUES ($1, $2)
    ON CONFLICT (message_sid) DO NOTHING
    "#,
  )
  .bind(message_sid)
  .bind(org_id)
  .execute(pool)
  .await?;
  Ok(res.rows_affected() > 0)
}
