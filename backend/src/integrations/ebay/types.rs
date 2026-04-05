use serde::Deserialize;


#[derive(Deserialize)]
pub struct TokenResponse {
  /* the access token */
  pub access_token: String,
  /* the refresh token */
  #[serde(default)]
  pub refresh_token: Option<String>,
  /* the expires in */
  pub expires_in: i64,
  /* the refresh token expires in */
  #[serde(default)]
  pub refresh_token_expires_in: Option<i64>,
  /* the token type */
  #[serde(default)]
  pub token_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct OAuthErrorBody {
  /* the error */
  pub error: String,
  /* the error description */
  #[serde(default)]
  pub error_description: Option<String>,
}