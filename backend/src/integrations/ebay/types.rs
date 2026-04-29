use serde::Deserialize;

#[derive(Deserialize)]
pub struct TokenResponse {
  pub access_token: String,          // access token
  pub refresh_token: Option<String>, // refresh token
  #[serde(default)]
  pub expires_in: i64, // expires in
  pub refresh_token_expires_in: Option<i64>, // refresh token expires in
  pub token_type: Option<String>,    // token type
}

#[derive(Debug, Deserialize)]
pub struct OAuthErrorBody {
  pub error: String, // error
  #[serde(default)]
  pub error_description: Option<String>, // error description
}
