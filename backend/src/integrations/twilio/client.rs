use base64::Engine;
use reqwest::header::AUTHORIZATION;

use crate::http_client;

pub async fn fetch_media_bytes(
  account_sid: &str,
  auth_token: &str,
  media_url: &str,
) -> Result<(Vec<u8>, Option<String>), String> {
  let basic = base64::engine::general_purpose::STANDARD.encode(format!("{account_sid}:{auth_token}"));
  let client = http_client::shared();
  let resp = client
    .get(media_url)
    .header(AUTHORIZATION, format!("Basic {basic}"))
    .send()
    .await
    .map_err(|e| format!("Twilio media fetch: {e}"))?;

  let ctype = resp
    .headers()
    .get(reqwest::header::CONTENT_TYPE)
    .and_then(|v| v.to_str().ok())
    .map(|s| s.split(';').next().unwrap_or(s).trim().to_string());

  let bytes = resp
    .bytes()
    .await
    .map_err(|e| format!("Twilio media body: {e}"))?
    .to_vec();

  Ok((bytes, ctype))
}
