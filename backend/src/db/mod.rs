//! Database connection pools.

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::time::Duration;

const ACQUIRE_TIMEOUT: Duration = Duration::from_secs(5);

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
  PgPoolOptions::new()
    .max_connections(5)
    .acquire_timeout(ACQUIRE_TIMEOUT)
    .connect(database_url)
    .await
}

pub async fn create_rate_limit_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
  PgPoolOptions::new()
    .max_connections(3)
    .acquire_timeout(ACQUIRE_TIMEOUT)
    .connect(database_url)
    .await
}
