use aws_sdk_s3::Client;
use sqlx::PgPool;

/// Shared application state for Axum handlers ([`State`](axum::extract::State)).
#[derive(Clone)]
pub struct AppState {
  pub pool: PgPool,
  pub s3_client: Option<Client>,
  pub s3_bucket: Option<String>,
}

impl AppState {
  pub fn new(pool: PgPool) -> Self {
    let (s3_client, s3_bucket) = match crate::s3::try_client_from_env() {
      Some(pair) => (Some(pair.0), Some(pair.1)),
      None => {
        let missing = crate::s3::missing_bucket_env_keys();
        if !missing.is_empty() {
          tracing::warn!(
            ?missing,
            "S3 disabled (503 on POST upload / GET / DELETE /api/v1/s3/objects): set object storage env vars"
          );
        }
        (None, None)
      }
    };
    Self {
      pool,
      s3_client,
      s3_bucket,
    }
  }
}
