//! Rate limiting for the free SEO audit tool.
//!
//! Uses Postgres tables to track usage per hashed IP:
//! - `audit_rate_limits`: 2 uses per 1-day rolling window
//! Logged-in users bypass via `X-Internal-User-Id`.

use sha2::{Digest, Sha256};
use sqlx::PgPool;

const WINDOW_DAYS: i64 = 1;
const AUDIT_MAX_USES: i32 = 2;

/// Checks the audit rate limit for the given IP and records the use if allowed.
///
/// On concurrent first-use requests from the same IP, handles unique violation
/// by retrying (the other request's insert will have succeeded).
///
/// # Returns
/// - `Ok(true)` — allowed; use was recorded
/// - `Ok(false)` — limit exceeded; caller should return 429
#[must_use = "callers must handle the Result and act on Ok(false)"]
pub async fn check_and_record(pool: &PgPool, ip: &str) -> Result<bool, sqlx::Error> {
  let ip_hash = hash_ip(ip);
  check_and_record_audit_by_hash(pool, &ip_hash).await
}

pub(crate) fn hash_ip(ip: &str) -> String {
  let mut hasher = Sha256::new();
  hasher.update(ip.as_bytes());
  hex::encode(hasher.finalize())
}

async fn check_and_record_audit_by_hash(
  pool: &PgPool,
  ip_hash: &str,
) -> Result<bool, sqlx::Error> {
  check_and_record_by_hash_impl(
    pool,
    ip_hash,
    "audit_rate_limits",
    AUDIT_MAX_USES,
  )
  .await
}

async fn check_and_record_by_hash_impl(
  pool: &PgPool,
  ip_hash: &str,
  table: &str,
  max_uses: i32,
) -> Result<bool, sqlx::Error> {
  let select_sql = format!(
    "SELECT first_used_at, usage_count FROM {} WHERE ip_hash = $1",
    table
  );
  loop {
    let row = sqlx::query_as::<_, (Option<chrono::DateTime<chrono::Utc>>, Option<i32>)>(
      &select_sql,
    )
    .bind(ip_hash)
    .fetch_optional(pool)
    .await?;

    match row {
      None => match insert_first_use(pool, ip_hash, table).await {
        Ok(ok) => return Ok(ok),
        Err(e) if is_unique_violation(&e) => continue,
        Err(e) => return Err(e),
      },
      Some((first_used_at, usage_count)) => {
        let first = first_used_at.unwrap_or_else(chrono::Utc::now);
        let count = usage_count.unwrap_or(0);
        let cutoff = chrono::Utc::now() - chrono::Duration::days(WINDOW_DAYS);

        return if first < cutoff {
          reset_window(pool, ip_hash, table).await
        } else if count >= max_uses {
          Ok(false)
        } else {
          increment_usage(pool, ip_hash, table).await
        };
      }
    }
  }
}

fn is_unique_violation(e: &sqlx::Error) -> bool {
  matches!(e, sqlx::Error::Database(db) if db.constraint().is_some())
}

async fn insert_first_use(
  pool: &PgPool,
  ip_hash: &str,
  table: &str,
) -> Result<bool, sqlx::Error> {
  let sql = format!(
    "INSERT INTO {} (ip_hash, first_used_at, usage_count) VALUES ($1, NOW(), 1)",
    table
  );
  sqlx::query(&sql).bind(ip_hash).execute(pool).await?;
  Ok(true)
}

async fn reset_window(
  pool: &PgPool,
  ip_hash: &str,
  table: &str,
) -> Result<bool, sqlx::Error> {
  let sql = format!(
    "UPDATE {} SET first_used_at = NOW(), usage_count = 1 WHERE ip_hash = $1",
    table
  );
  sqlx::query(&sql).bind(ip_hash).execute(pool).await?;
  Ok(true)
}

async fn increment_usage(
  pool: &PgPool,
  ip_hash: &str,
  table: &str,
) -> Result<bool, sqlx::Error> {
  let sql = format!(
    "UPDATE {} SET usage_count = usage_count + 1 WHERE ip_hash = $1",
    table
  );
  sqlx::query(&sql).bind(ip_hash).execute(pool).await?;
  Ok(true)
}

#[cfg(test)]
mod tests {
  use super::{check_and_record, hash_ip};
  use sqlx::PgPool;

  #[sqlx::test(migrations = "../migrations")]
  async fn first_use_allowed(pool: PgPool) -> sqlx::Result<()> {
    let allowed = check_and_record(&pool, "192.168.1.1").await?;
    assert!(allowed);
    Ok(())
  }

  #[sqlx::test(migrations = "../migrations")]
  async fn second_use_allowed(pool: PgPool) -> sqlx::Result<()> {
    assert!(check_and_record(&pool, "10.0.0.1").await?);
    assert!(check_and_record(&pool, "10.0.0.1").await?);
    Ok(())
  }

  #[sqlx::test(migrations = "../migrations")]
  async fn third_use_rejected(pool: PgPool) -> sqlx::Result<()> {
    assert!(check_and_record(&pool, "172.16.0.1").await?);
    assert!(check_and_record(&pool, "172.16.0.1").await?);
    let allowed = check_and_record(&pool, "172.16.0.1").await?;
    assert!(!allowed);
    Ok(())
  }

  #[sqlx::test(migrations = "../migrations")]
  async fn window_reset_after_2_days(pool: PgPool) -> sqlx::Result<()> {
    let ip = "203.0.113.1";
    assert!(check_and_record(&pool, ip).await?);
    assert!(check_and_record(&pool, ip).await?);
    assert!(!check_and_record(&pool, ip).await?);

    let ip_hash = hash_ip(ip);
    sqlx::query(
      "UPDATE audit_rate_limits SET first_used_at = NOW() - INTERVAL '3 days' WHERE ip_hash = $1",
    )
    .bind(&ip_hash)
    .execute(&pool)
    .await?;

    let allowed = check_and_record(&pool, ip).await?;
    assert!(allowed);
    Ok(())
  }
}
