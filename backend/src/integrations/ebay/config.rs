use std::env::VarError;

#[derive(Debug, Clone)]
pub struct EbayConfig {
  /* whether to use the sandbox environment */
  pub sandbox: bool,
  /* the client ID for the application */
  pub client_id: String,
  /* the client secret for the application */
  pub client_secret: String,
  /* the redirect URI for the application */
  pub oauth_redirect_uri: String,
  /* OAuth scopes: space-separated string (from EBAY_OAUTH_SCOPES or EBAY_OAUTH_SCOPE). */
  pub oauth_scope: String,
  /* the success redirect URI for the application */
  pub oauth_success_redirect: String,
}

fn env_var(key: &'static str) -> Result<String, VarError> {
  std::env::var(key)
}

impl EbayConfig {
  pub fn from_env() -> Result<Self, VarError> {
    let sandbox = matches!(
      env_flag("EBAY_USE_SANDBOX").as_deref(),
      Some("1") | Some("true") | Some("yes"),
    );

    let oauth_scope = env_var("EBAY_OAUTH_SCOPES").or_else(|_| env_var("EBAY_OAUTH_SCOPE"))?;

    Ok(Self {
      sandbox,
      client_id: env_var("EBAY_CLIENT_ID")?,
      client_secret: env_var("EBAY_CLIENT_SECRET")?,
      oauth_redirect_uri: env_var("EBAY_OAUTH_REDIRECT_URI")?,
      oauth_scope,
      oauth_success_redirect: std::env::var("EBAY_OAUTH_SUCCESS_REDIRECT")
        .unwrap_or_else(|_| "http://localhost:3001/app".into()),
    })
  }

  pub fn auth_authorize_url(&self) -> &'static str {
    if self.sandbox {
      "https://auth.sandbox.ebay.com/oauth2/authorize"
    } else {
      "https://auth.ebay.com/oauth2/authorize"
    }
  }

  pub fn oauth_token_url(&self) -> &'static str {
    if self.sandbox {
      "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
    } else {
      "https://api.ebay.com/identity/v1/oauth2/token"
    }
  }

  pub fn api_base_url(&self) -> &'static str {
    if self.sandbox {
      "https://api.sandbox.ebay.com"
    } else {
      "https://api.ebay.com"
    }
  }
}

fn env_flag(key: &str) -> Option<String> {
  std::env::var(key).ok()
}
