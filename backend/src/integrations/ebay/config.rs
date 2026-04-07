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

fn require_env(key: &'static str) -> Result<String, &'static str> {
  std::env::var(key).map_err(|_| key)
}

impl EbayConfig {
  /// Loads config from env. On error, returns the **name of the first missing variable**
  /// (or a short hint for the scopes pair).
  pub fn from_env() -> Result<Self, &'static str> {
    let sandbox = matches!(
      env_flag("EBAY_USE_SANDBOX").as_deref(),
      Some("1") | Some("true") | Some("yes"),
    );

    let client_id = require_env("EBAY_CLIENT_ID")?;
    let client_secret = require_env("EBAY_CLIENT_SECRET")?;
    let oauth_redirect_uri = require_env("EBAY_OAUTH_REDIRECT_URI")?;
    let oauth_scope = require_env("EBAY_OAUTH_SCOPES")
      .or_else(|_| require_env("EBAY_OAUTH_SCOPE"))
      .map_err(|_| "EBAY_OAUTH_SCOPES (or EBAY_OAUTH_SCOPE as fallback)")?;

    Ok(Self {
      sandbox,
      client_id,
      client_secret,
      oauth_redirect_uri,
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
