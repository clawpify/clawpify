#[derive(Debug, Clone)]
pub struct EbayConfig {
  pub sandbox: bool,                                 // whether to use the sandbox environment
  pub client_id: String,                             // client id
  pub client_secret: String,                         // client secret
  pub oauth_ru_name: String,                         // eBay RuName value passed as OAuth redirect_uri
  pub oauth_scope: String,                           // oauth scope
  pub oauth_success_redirect: String,                // oauth success redirect uri
}

fn require_env(key: &'static str) -> Result<String, &'static str> {
  std::env::var(key).map_err(|_| key)
}

fn looks_like_url(value: &str) -> bool {
  value.starts_with("http://") || value.starts_with("https://")
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
    // eBay calls this request parameter `redirect_uri`, but REST OAuth expects
    // the app's generated RuName here, not the accepted/declined callback URL.
    let oauth_ru_name = require_env("EBAY_OAUTH_REDIRECT_URI")?;
    if looks_like_url(&oauth_ru_name) {
      return Err("EBAY_OAUTH_REDIRECT_URI must be the eBay RuName, not callback URL");
    }
    let oauth_scope = require_env("EBAY_OAUTH_SCOPES")
      .or_else(|_| require_env("EBAY_OAUTH_SCOPE"))
      .map_err(|_| "EBAY_OAUTH_SCOPES (or EBAY_OAUTH_SCOPE as fallback)")?;

    Ok(Self {
      sandbox,
      client_id,
      client_secret,
      oauth_ru_name,
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
