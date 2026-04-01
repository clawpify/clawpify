use std::time::Duration;

use aws_sdk_s3::presigning::{PresignedRequest, PresigningConfig};
use aws_sdk_s3::Client;

const MAX_EXPIRES_SECS: u64 = 3600;

fn presign_config(expires_secs: u64) -> PresigningConfig {
  let secs = expires_secs.min(MAX_EXPIRES_SECS);
  PresigningConfig::expires_in(Duration::from_secs(secs)).expect("presign ttl")
}

pub async fn presign_get(
  client: &Client,
  bucket: &str,
  key: &str,
  expires_secs: u64,
) -> Result<PresignedRequest, aws_sdk_s3::error::SdkError<aws_sdk_s3::operation::get_object::GetObjectError>>
{
  client
    .get_object()
    .bucket(bucket)
    .key(key)
    .presigned(presign_config(expires_secs))
    .await
}
