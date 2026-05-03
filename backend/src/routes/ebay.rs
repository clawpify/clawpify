use axum::{
  extract::{Query, State},
  middleware,
  response::{IntoResponse, Redirect, Response},
  routing::{get, put},
  Json, Router,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::extractors::OrgId;
use super::state::AppState;
use crate::error::{self, ApiError};
use crate::integrations::ebay::account::{
  location_options, policy_options, EbayAccount, EbayAccountError, EbayLocationOption,
  EbayPolicyOption,
};
use crate::integrations::ebay::oauth::{self, EbayOAuthError};
use crate::integrations::ebay::state_token::{self, StateTokenError};
use crate::integrations::ebay::token_service::EbayTokenService;
use crate::middleware as mw;
use crate::repositories::ebay_policy_defaults::EbayPolicyDefaults;
use crate::repositories::{channel_connections, ebay_policy_defaults};

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

#[derive(Deserialize, ToSchema)]
pub struct EbayOAuthStartQuery {
  pub reconnect: Option<String>,
}

impl EbayOAuthStartQuery {
  fn reconnect_enabled(&self) -> Result<bool, ApiError> {
    let Some(raw) = self.reconnect.as_deref() else {
      return Ok(false);
    };
    match raw.trim().to_ascii_lowercase().as_str() {
      "" | "0" | "false" | "no" | "off" => Ok(false),
      "1" | "true" | "yes" | "on" => Ok(true),
      _ => Err(error::bad_request("reconnect must be true or false")),
    }
  }
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct EbayPoliciesResponse {
  pub marketplace_id: String,
  pub fulfillment_policies: Vec<EbayPolicyOption>,
  pub payment_policies: Vec<EbayPolicyOption>,
  pub return_policies: Vec<EbayPolicyOption>,
  pub locations: Vec<EbayLocationOption>,
  pub defaults: Option<EbayPolicyDefaults>,
  pub missing: Vec<String>,
}

#[derive(serde::Deserialize, utoipa::ToSchema)]
pub struct SaveEbayPolicyDefaultsRequest {
  pub marketplace_id: String,
  pub fulfillment_policy_id: String,
  pub payment_policy_id: String,
  pub return_policy_id: String,
  pub merchant_location_key: Option<String>,
}

pub fn routes() -> Router<AppState> {
  let protected = Router::new()
    .route("/oauth/ebay/start", get(ebay_oauth_start))
    .route("/oauth/ebay/status", get(ebay_oauth_status))
    .route("/ebay/seller/setup", get(ebay_seller_setup))
    .route("/ebay/policies", get(ebay_policies))
    .route("/ebay/policies/defaults", put(save_ebay_policy_defaults))
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
  Query(q): Query<EbayOAuthStartQuery>,
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

  let url = oauth::authorize_url(cfg, &st, q.reconnect_enabled()?);

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
  pub local_pickup: bool,
  pub fulfillment_policies: serde_json::Value,
  pub payment_policies: serde_json::Value,
  pub return_policies: serde_json::Value,
  pub locations: serde_json::Value,
}

fn default_marketplace_id() -> String {
  "EBAY_US".to_string()
}

fn settings_redirect(origin: &str, value: &str) -> Result<String, ApiError> {
  super::spa_redirects::util::app_path_url_with_query_pair(
    origin,
    "/app/settings",
    "ebay_oauth",
    value,
  )
}

fn setup_missing(
  fulfillment_policies: &[EbayPolicyOption],
  payment_policies: &[EbayPolicyOption],
  return_policies: &[EbayPolicyOption],
  locations: &[EbayLocationOption],
) -> Vec<String> {
  let mut missing = Vec::new();
  if fulfillment_policies.is_empty() {
    missing.push("shipping policy".to_string());
  }
  if payment_policies.is_empty() {
    missing.push("payment policy".to_string());
  }
  if return_policies.is_empty() {
    missing.push("return policy".to_string());
  }
  if locations.is_empty() {
    missing.push("inventory location".to_string());
  }
  missing
}

fn contains_policy(policies: &[EbayPolicyOption], id: &str) -> bool {
  policies.iter().any(|policy| policy.id == id)
}

fn contains_location(locations: &[EbayLocationOption], key: Option<&str>) -> bool {
  match key.map(str::trim).filter(|value| !value.is_empty()) {
    Some(key) => locations.iter().any(|location| location.key == key),
    None => true,
  }
}

async fn fetch_ebay_policies(
  state: &AppState,
  org_id: &str,
  marketplace_id: &str,
) -> Result<EbayPoliciesResponse, ApiError> {
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
  .bearer_for_org(org_id)
  .await
  .map_err(|e| ApiError::bad_request(e.to_string()))?;

  let account = EbayAccount {
    cfg,
    access_token: &bearer,
  };
  let setup = account
    .seller_setup(marketplace_id, false)
    .await
    .map_err(map_account_err)?;

  let fulfillment_raw = setup
    .get("fulfillment_policies")
    .unwrap_or(&serde_json::Value::Null);
  let payment_raw = setup
    .get("payment_policies")
    .unwrap_or(&serde_json::Value::Null);
  let return_raw = setup
    .get("return_policies")
    .unwrap_or(&serde_json::Value::Null);
  let locations_raw = setup.get("locations").unwrap_or(&serde_json::Value::Null);

  let fulfillment_policies = policy_options(
    fulfillment_raw,
    "fulfillmentPolicies",
    "fulfillmentPolicyId",
  );
  let payment_policies = policy_options(payment_raw, "paymentPolicies", "paymentPolicyId");
  let return_policies = policy_options(return_raw, "returnPolicies", "returnPolicyId");
  let locations = location_options(locations_raw);
  let missing = setup_missing(
    &fulfillment_policies,
    &payment_policies,
    &return_policies,
    &locations,
  );
  let defaults = ebay_policy_defaults::get(&state.pool, org_id, marketplace_id)
    .await
    .map_err(error::db_error)?;

  Ok(EbayPoliciesResponse {
    marketplace_id: marketplace_id.to_string(),
    fulfillment_policies,
    payment_policies,
    return_policies,
    locations,
    defaults,
    missing,
  })
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
  params(
    ("marketplace_id" = Option<String>, Query, description = "eBay marketplace id, defaults to EBAY_US")
  ),
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
  // Clawpify currently creates shipping-only eBay drafts. Ignore stale clients that still send
  // local_pickup=true so seller setup always selects a shipping fulfillment policy.
  let local_pickup = false;
  let setup = account
    .seller_setup(&q.marketplace_id, local_pickup)
    .await
    .map_err(map_account_err)?;

  Ok(Json(EbaySellerSetupResponse {
    marketplace_id: q.marketplace_id,
    local_pickup,
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
  path = "/ebay/policies",
  tag = "ebay",
  security(("internal_user" = []), ("internal_org" = [])),
  params(
    ("marketplace_id" = Option<String>, Query, description = "eBay marketplace id, defaults to EBAY_US")
  ),
  responses(
    (status = 200, description = "eBay policies, locations, and saved defaults", body = EbayPoliciesResponse),
    (status = 400, description = "Bad request", body = ErrorEnvelope),
    (status = 502, description = "eBay API failed", body = ErrorEnvelope)
  )
)]
async fn ebay_policies(
  State(state): State<AppState>,
  org: OrgId,
  Query(q): Query<EbaySellerSetupQuery>,
) -> Result<Json<EbayPoliciesResponse>, ApiError> {
  Ok(Json(
    fetch_ebay_policies(&state, org.as_ref(), &q.marketplace_id).await?,
  ))
}

#[utoipa::path(
  put,
  path = "/ebay/policies/defaults",
  tag = "ebay",
  security(("internal_user" = []), ("internal_org" = [])),
  request_body = SaveEbayPolicyDefaultsRequest,
  responses(
    (status = 200, description = "Saved eBay policy defaults", body = EbayPolicyDefaults),
    (status = 400, description = "Bad request", body = ErrorEnvelope),
    (status = 502, description = "eBay API failed", body = ErrorEnvelope)
  )
)]
async fn save_ebay_policy_defaults(
  State(state): State<AppState>,
  org: OrgId,
  Json(req): Json<SaveEbayPolicyDefaultsRequest>,
) -> Result<Json<EbayPolicyDefaults>, ApiError> {
  let marketplace_id = req.marketplace_id.trim();
  let fulfillment_policy_id = req.fulfillment_policy_id.trim();
  let payment_policy_id = req.payment_policy_id.trim();
  let return_policy_id = req.return_policy_id.trim();
  let merchant_location_key = req
    .merchant_location_key
    .as_deref()
    .map(str::trim)
    .filter(|value| !value.is_empty())
    .map(str::to_string);

  if marketplace_id.is_empty()
    || fulfillment_policy_id.is_empty()
    || payment_policy_id.is_empty()
    || return_policy_id.is_empty()
  {
    return Err(error::bad_request(
      "marketplace_id, fulfillment_policy_id, payment_policy_id, and return_policy_id are required",
    ));
  }

  let policies = fetch_ebay_policies(&state, org.as_ref(), marketplace_id).await?;
  if !contains_policy(&policies.fulfillment_policies, fulfillment_policy_id) {
    return Err(error::bad_request(
      "Selected eBay shipping policy was not found",
    ));
  }
  if !contains_policy(&policies.payment_policies, payment_policy_id) {
    return Err(error::bad_request(
      "Selected eBay payment policy was not found",
    ));
  }
  if !contains_policy(&policies.return_policies, return_policy_id) {
    return Err(error::bad_request(
      "Selected eBay return policy was not found",
    ));
  }
  if !contains_location(&policies.locations, merchant_location_key.as_deref()) {
    return Err(error::bad_request(
      "Selected eBay inventory location was not found",
    ));
  }

  let saved = ebay_policy_defaults::upsert(
    &state.pool,
    &EbayPolicyDefaults {
      org_id: org.as_ref().to_string(),
      marketplace_id: marketplace_id.to_string(),
      fulfillment_policy_id: fulfillment_policy_id.to_string(),
      payment_policy_id: payment_policy_id.to_string(),
      return_policy_id: return_policy_id.to_string(),
      merchant_location_key,
    },
  )
  .await
  .map_err(error::db_error)?;

  Ok(Json(saved))
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
      let target = settings_redirect(&origin, "no_callback_params")?;
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
    if let Some(origin) = spa_redirect_origin(&state) {
      let target = settings_redirect(&origin, "declined")?;
      tracing::info!(message = %msg, "ebay OAuth declined; redirecting to settings");
      return Ok(Redirect::temporary(&target).into_response());
    }
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

  ebay_policy_defaults::delete_for_org(&state.pool, &payload.org_id)
    .await
    .map_err(error::db_error)?;

  if let Some(origin) = spa_redirect_origin(&state) {
    let target = settings_redirect(&origin, "connected")?;
    return Ok(Redirect::temporary(&target).into_response());
  }

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
    EbayAccountError::NoMatchingFulfillmentPolicy { .. } => ApiError::bad_request(e.to_string()),
    EbayAccountError::Api { body, .. } if body.contains("Business Policy") => ApiError::bad_gateway(
      "eBay seller account is not eligible for Business Policies yet. Enable Seller Hub/Business Policies in eBay, then create or edit a fulfillment policy with localPickup: false.",
    ),
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
    ebay_seller_setup,
    ebay_policies,
    save_ebay_policy_defaults
  ),
  components(schemas(
    EbayCallbackQuery,
    EbayOAuthStartResponse,
    EbayStatusResponse,
    EbaySellerSetupQuery,
    EbaySellerSetupResponse,
    EbayPoliciesResponse,
    SaveEbayPolicyDefaultsRequest,
    EbayPolicyDefaults
  ))
)]
pub struct EbayOpenApiDoc;
