use axum::{
  extract::{Query, State},
  middleware,
  response::{IntoResponse, Redirect, Response},
  routing::get,
  Json, Router,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::extractors::OrgId;
use super::state::AppState;
use crate::error::{self, ApiError};
use crate::integrations::ebay::account::{EbayAccount, EbayAccountError};
use crate::integrations::ebay::oauth::{self, EbayOAuthError};
use crate::integrations::ebay::state_token::{self, StateTokenError};
use crate::integrations::ebay::token_service::EbayTokenService;
use crate::middleware as mw;
use crate::repositories::channel_connections;

/// SPA origin for redirects. Prefer `APP_PUBLIC_ORIGIN` (must be the **frontend** URL, not the API/ngrok host).
/// If unset, pick from `CORS_ALLOWED_ORIGINS`: **loopback first** (`localhost` / `127.0.0.1`), then first entry —
/// so listing the public API origin first does not send users to `/app` on a server that has no SPA.
fn spa_redirect_origin(state: &AppState) -> Option<String> {
  if let Some(o) = state.app_public_origin.clone().filter(|s| !s.is_empty()) {
    return Some(o);
  }
  let cors = std::env::var("CORS_ALLOWED_ORIGINS").ok()?;
  let origins: Vec<String> = cors
    .split(',')
    .map(|s| s.trim().trim_end_matches('/').to_string())
    .filter(|s| !s.is_empty())
    .collect();
  let preferred = origins.iter().find(|o| {
    let l = o.to_lowercase();
    l.contains("127.0.0.1") || l.contains("localhost")
  });
  preferred.cloned().or_else(|| origins.first().cloned())
}

#[derive(Deserialize, ToSchema)]
pub struct EbayCallbackQuery {
  pub code: Option<String>,
  pub state: Option<String>,
  pub error: Option<String>,
  pub error_description: Option<String>,
}

pub fn routes() -> Router<AppState> {
  let protected = Router::new()
    .route("/oauth/ebay/start", get(ebay_oauth_start))
    .route("/oauth/ebay/status", get(ebay_oauth_status))
    .route("/ebay/seller/setup", get(ebay_seller_setup))
    .route_layer(middleware::from_fn(mw::require_internal_auth));

  let public = Router::new().route("/oauth/ebay/callback", get(ebay_oauth_callback));

  protected.merge(public)
}

#[utoipa::path(
  get,
  path = "/oauth/ebay/start",
  tag = "ebay",
  security(("internal_user" = []), ("internal_org" = [])),
  responses(
    (status = 200, description = "Authorize URL for eBay (open in a window / same tab)", body = EbayOAuthStartResponse),
    (status = 400, description = "Bad request", body = ErrorEnvelope),
    (status = 500, description = "Misconfigured", body = ErrorEnvelope)
  )
)]
async fn ebay_oauth_start(
  State(state): State<AppState>,
  org: OrgId,
) -> Result<Json<EbayOAuthStartResponse>, ApiError> {
  let cfg = state
    .ebay_config
    .as_ref()
    .ok_or_else(|| error::internal("eBay OAuth is not configured"))?;

  let secret =
    std::env::var("OAUTH_STATE_SECRET").map_err(|_| error::internal("OAUTH_STATE_SECRET"))?;

  let st = state_token::sign_state(secret.as_bytes(), org.as_ref(), 900)
    .map_err(|_| error::bad_request("state"))?;

  let url = oauth::authorize_url(cfg, &st);

  Ok(Json(EbayOAuthStartResponse { url }))
}

#[derive(Serialize, ToSchema)]
pub struct EbayOAuthStartResponse {
  /// eBay authorize URL; open in the browser (SPA fetch cannot rely on redirect `Location` cross-origin).
  pub url: String,
}

#[derive(Serialize, ToSchema)]
pub struct EbayStatusResponse {
  pub connected: bool,
}

#[derive(Deserialize, ToSchema)]
pub struct EbaySellerSetupQuery {
  #[serde(default = "default_marketplace_id")]
  pub marketplace_id: String,
}

#[derive(Serialize, ToSchema)]
pub struct EbaySellerSetupResponse {
  pub marketplace_id: String,
  pub fulfillment_policies: serde_json::Value,
  pub payment_policies: serde_json::Value,
  pub return_policies: serde_json::Value,
  pub locations: serde_json::Value,
}

fn default_marketplace_id() -> String {
  "EBAY_US".to_string()
}

#[utoipa::path(
  get,
  path = "/oauth/ebay/status",
  tag = "ebay",
  security(("internal_user" = []), ("internal_org" = [])),
  responses(
    (status = 200, description = "Connection status", body = EbayStatusResponse),
    (status = 500, description = "Server error", body = ErrorEnvelope)
  )
)]
async fn ebay_oauth_status(
  State(state): State<AppState>,
  org: OrgId,
) -> Result<Json<EbayStatusResponse>, ApiError> {
  let row = channel_connections::get_ebay_secrets(&state.pool, org.as_ref())
    .await
    .map_err(error::db_error)?;
  Ok(Json(EbayStatusResponse {
    connected: row.is_some(),
  }))
}

#[utoipa::path(
  get,
  path = "/ebay/seller/setup",
  tag = "ebay",
  security(("internal_user" = []), ("internal_org" = [])),
  params(("marketplace_id" = Option<String>, Query, description = "eBay marketplace id, defaults to EBAY_US")),
  responses(
    (status = 200, description = "Seller policies and inventory locations", body = EbaySellerSetupResponse),
    (status = 400, description = "Bad request", body = ErrorEnvelope),
    (status = 502, description = "eBay API failed", body = ErrorEnvelope)
  )
)]
async fn ebay_seller_setup(
  State(state): State<AppState>,
  org: OrgId,
  Query(q): Query<EbaySellerSetupQuery>,
) -> Result<Json<EbaySellerSetupResponse>, ApiError> {
  let cfg = state
    .ebay_config
    .as_ref()
    .ok_or_else(|| error::internal("eBay not configured"))?;
  let crypto = state
    .token_crypto
    .as_ref()
    .ok_or_else(|| error::internal("CHANNEL_ENCRYPTION_KEY / token crypto"))?;

  let bearer = EbayTokenService {
    pool: &state.pool,
    cfg,
    crypto,
  }
  .bearer_for_org(org.as_ref())
  .await
  .map_err(|e| ApiError::bad_request(e.to_string()))?;

  let account = EbayAccount {
    cfg,
    access_token: &bearer,
  };
  let setup = account
    .seller_setup(&q.marketplace_id)
    .await
    .map_err(map_account_err)?;

  Ok(Json(EbaySellerSetupResponse {
    marketplace_id: q.marketplace_id,
    fulfillment_policies: setup
      .get("fulfillment_policies")
      .cloned()
      .unwrap_or(serde_json::Value::Null),
    payment_policies: setup
      .get("payment_policies")
      .cloned()
      .unwrap_or(serde_json::Value::Null),
    return_policies: setup
      .get("return_policies")
      .cloned()
      .unwrap_or(serde_json::Value::Null),
    locations: setup
      .get("locations")
      .cloned()
      .unwrap_or(serde_json::Value::Null),
  }))
}

#[utoipa::path(
  get,
  path = "/oauth/ebay/callback",
  tag = "ebay",
  params(
    ("code" = Option<String>, Query, description = "Authorization code from eBay"),
    ("state" = Option<String>, Query, description = "State token from start URL"),
    ("error" = Option<String>, Query, description = "OAuth error code"),
    ("error_description" = Option<String>, Query, description = "OAuth error description")
  ),
  responses(
    (status = 307, description = "Redirect to configured success URL or SPA"),
    (status = 400, description = "Bad request", body = ErrorEnvelope),
    (status = 502, description = "Token exchange failed", body = ErrorEnvelope)
  )
)]
async fn ebay_oauth_callback(
  State(state): State<AppState>,
  Query(q): Query<EbayCallbackQuery>,
) -> Result<Response, ApiError> {
  // Bare /oauth/ebay/callback (no ?code= / ?state=): direct open, refresh, or ngrok UI link without eBay's query string.
  if q.error.is_none() && q.code.is_none() && q.state.is_none() {
    if let Some(origin) = spa_redirect_origin(&state) {
      let target = super::spa_redirects::util::app_url_with_query_pair(
        &origin,
        "ebay_oauth",
        "no_callback_params",
      )?;
      tracing::info!(%origin, "ebay OAuth callback visited without query; redirecting to SPA");
      return Ok(Redirect::temporary(&target).into_response());
    }
    return Err(error::bad_request(
      "This eBay callback was opened without ?code= and ?state= (typical: clicking the path in ngrok). \
       Use Connect eBay in the app. Set APP_PUBLIC_ORIGIN or CORS_ALLOWED_ORIGINS (first origin) \
       so such visits redirect to /app?ebay_oauth=no_callback_params.",
    ));
  }

  let cfg = state
    .ebay_config
    .as_ref()
    .ok_or_else(|| error::internal("eBay OAuth is not configured"))?;

  let crypto = state
    .token_crypto
    .as_ref()
    .ok_or_else(|| error::internal("CHANNEL_ENCRYPTION_KEY is not configured"))?;

  if let Some(err) = q.error {
    let msg = q.error_description.unwrap_or(err);
    return Err(error::bad_request(&msg));
  }

  let code = q.code.ok_or_else(|| {
    error::bad_request("missing code (finish sign-in on eBay or do not refresh this URL)")
  })?;

  let state_tok = q.state.ok_or_else(|| error::bad_request("missing state"))?;

  let secret =
    std::env::var("OAUTH_STATE_SECRET").map_err(|_| error::internal("OAUTH_STATE_SECRET"))?;

  let payload = state_token::verify_state(secret.as_bytes(), &state_tok).map_err(|e| match e {
    StateTokenError::Expired => error::bad_request("state expired"),
    _ => error::bad_request("bad state"),
  })?;

  let token = oauth::exchange_code_for_token(cfg, &code)
    .await
    .map_err(map_oauth_err)?;

  let refresh = token
    .refresh_token
    .clone()
    .ok_or_else(|| error::bad_gateway("ebay token response missing refresh_token"))?;

  let json = serde_json::json!({
    "access_token": token.access_token,
    "refresh_token": refresh,
  })
  .to_string();

  let (nonce, ct) = crypto
    .encrypt_json(&json)
    .map_err(|_| error::internal("encrypt"))?;

  let exp = chrono::Utc::now() + chrono::Duration::seconds(token.expires_in);

  channel_connections::upsert_ebay(
    &state.pool,
    &payload.org_id,
    Some(cfg.oauth_scope.as_str()),
    ct.as_slice(),
    nonce.as_slice(),
    Some(exp),
  )
  .await
  .map_err(error::db_error)?;

  Ok(Redirect::temporary(&cfg.oauth_success_redirect).into_response())
}

fn map_oauth_err(e: EbayOAuthError) -> ApiError {
  match e {
    EbayOAuthError::Ebay { status, body } => {
      tracing::warn!(%status, body_len = body.len(), "ebay token error");
      error::bad_gateway(oauth::parse_oauth_error_body(&body).unwrap_or(body))
    }
    _ => error::bad_gateway("ebay token request failed"),
  }
}

fn map_account_err(e: EbayAccountError) -> ApiError {
  match e {
    EbayAccountError::Api { .. } => ApiError::bad_gateway(e.to_string()),
    EbayAccountError::Http(_) | EbayAccountError::Json(_) => ApiError::bad_gateway(e.to_string()),
  }
}

#[derive(utoipa::OpenApi)]
#[openapi(
  paths(
    ebay_oauth_start,
    ebay_oauth_status,
    ebay_oauth_callback,
    ebay_seller_setup
  ),
  components(schemas(
    EbayCallbackQuery,
    EbayOAuthStartResponse,
    EbayStatusResponse,
    EbaySellerSetupQuery,
    EbaySellerSetupResponse
  ))
)]
pub struct EbayOpenApiDoc;
