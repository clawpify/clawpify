use aws_sdk_s3::config::{BehaviorVersion, Builder, Credentials, Region};
use aws_sdk_s3::Client;

mod presign;

pub use presign::presign_get;

const BUCKET_KEYS: &[&str] = &[
  "BUCKET_ENDPOINT_URL",
  "BUCKET_REGION",
  "BUCKET_NAME",
  "BUCKET_ID",
  "BUCKET_SECRET",
];

/// Which `BUCKET_*` vars are unset or blank (names only — safe to log).
pub fn missing_bucket_env_keys() -> Vec<&'static str> {
  BUCKET_KEYS
    .iter()
    .copied()
    .filter(|k| {
      std::env::var(k)
        .map(|v| v.trim().is_empty())
        .unwrap_or(true)
    })
    .collect()
}

/// Railway / S3-compatible bucket from env. Missing any required var → `None`.
pub fn try_client_from_env() -> Option<(Client, String)> {
  let endpoint = std::env::var("BUCKET_ENDPOINT_URL").ok()?;
  let region = std::env::var("BUCKET_REGION").ok()?;
  let bucket = std::env::var("BUCKET_NAME").ok()?;
  let access_key = std::env::var("BUCKET_ID").ok()?;
  let secret_key = std::env::var("BUCKET_SECRET").ok()?;

  if [endpoint.trim(), region.trim(), bucket.trim(), access_key.trim(), secret_key.trim()]
    .iter()
    .any(|s| s.is_empty())
  {
    return None;
  }

  let creds = Credentials::new(
    access_key.trim(),
    secret_key.trim(),
    None,
    None,
    "railway-bucket",
  );

  let force_path = std::env::var("BUCKET_FORCE_PATH_STYLE")
    .ok()
    .as_deref()
    == Some("1");

  let conf = Builder::new()
    .behavior_version(BehaviorVersion::latest())
    .credentials_provider(creds)
    .region(Region::new(region.trim().to_string()))
    .endpoint_url(endpoint.trim())
    .force_path_style(force_path)
    .build();

  Some((Client::from_conf(conf), bucket.trim().to_string()))
}
