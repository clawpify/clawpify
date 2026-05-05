use axum::{
  extract::{Query, State},
  middleware,
  response::{IntoResponse, Redirect, Response},
  routing::{get, post, put},
  Json, Router,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use super::extractors::OrgId;
use super::state::AppState;
use crate::error::{self, ApiError};
use crate::integrations::ebay::account::{
  location_options, normalize_location_key, policy_options, validate_policy_selection, EbayAccount,
  EbayAccountError, EbayLocationOption, EbayPolicyOption,
};
use crate::integrations::ebay::error_utils::{ebay_error_message, public_ebay_api_error};
use crate::integrations::ebay::inventory::{
  CreateInventoryLocationRequest as EbayCreateInventoryLocationRequest, EbayInventory,
  EbayInventoryError,
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
pub struct EbayPolicyCounts {
  pub fulfillment: usize,
  pub payment: usize,
  pub returns: usize,
  pub locations: usize,
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
  pub counts: EbayPolicyCounts,
}

#[derive(serde::Deserialize, utoipa::ToSchema)]
pub struct SaveEbayPolicyDefaultsRequest {
  pub marketplace_id: String,
  pub fulfillment_policy_id: String,
  pub payment_policy_id: String,
  pub return_policy_id: String,
  pub merchant_location_key: Option<String>,
}

fn default_location_country() -> String {
  "US".to_string()
}

#[derive(serde::Deserialize, utoipa::ToSchema)]
pub struct CreateEbayLocationRequest {
  pub name: String,
  #[serde(default)]
  pub address_line1: String,
  #[serde(default)]
  pub city: String,
  #[serde(default)]
  pub state_or_province: String,
  #[serde(default)]
  pub postal_code: String,
  #[serde(default = "default_location_country")]
  pub country: String,
}

pub fn routes() -> Router<AppState> {
  let protected = Router::new()
    .route("/oauth/ebay/start", get(ebay_oauth_start))
    .route("/oauth/ebay/status", get(ebay_oauth_status))
    .route("/ebay/seller/setup", get(ebay_seller_setup))
    .route("/ebay/locations", post(create_ebay_location))
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

fn cleaned_field(value: &str) -> String {
  value
    .trim()
    .split_whitespace()
    .collect::<Vec<_>>()
    .join(" ")
}

fn is_canadian_postal_code(value: &str) -> bool {
  let compact: String = value
    .chars()
    .filter(|ch| !ch.is_whitespace())
    .map(|ch| ch.to_ascii_uppercase())
    .collect();
  let chars: Vec<char> = compact.chars().collect();
  chars.len() == 6
    && chars[0].is_ascii_alphabetic()
    && chars[1].is_ascii_digit()
    && chars[2].is_ascii_alphabetic()
    && chars[3].is_ascii_digit()
    && chars[4].is_ascii_alphabetic()
    && chars[5].is_ascii_digit()
}

fn inferred_location_country(country: &str, postal_code: &str) -> String {
  let country = cleaned_field(country).to_ascii_uppercase();
  if !country.is_empty() {
    return country;
  }
  if is_canadian_postal_code(postal_code) {
    "CA".to_string()
  } else {
    "US".to_string()
  }
}

fn location_slug(value: &str) -> String {
  let mut out = String::new();
  let mut last_dash = false;
  for ch in value.trim().to_ascii_lowercase().chars() {
    if ch.is_ascii_alphanumeric() {
      out.push(ch);
      last_dash = false;
    } else if !last_dash {
      out.push('-');
      last_dash = true;
    }
  }
  let slug = out.trim_matches('-').to_string();
  if slug.is_empty() {
    "location".to_string()
  } else {
    slug
  }
}

fn short_location_hash(input: &str) -> String {
  let mut hash = 0x811c9dc5_u32;
  for byte in input.as_bytes() {
    hash ^= u32::from(*byte);
    hash = hash.wrapping_mul(0x01000193);
  }
  format!("{hash:08x}")
}

fn merchant_location_key(req: &CreateEbayLocationRequest) -> String {
  let seed = format!(
    "{}|{}|{}|{}|{}|{}",
    req.name, req.address_line1, req.city, req.state_or_province, req.postal_code, req.country
  );
  let hash = short_location_hash(&seed);
  let slug = location_slug(&req.name);
  let max_slug_len = 36_usize.saturating_sub("clawpify--".len() + hash.len());
  let slug: String = slug.chars().take(max_slug_len.max(1)).collect();
  format!("clawpify-{slug}-{hash}")
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
  let counts = EbayPolicyCounts {
    fulfillment: fulfillment_policies.len(),
    payment: payment_policies.len(),
    returns: return_policies.len(),
    locations: locations.len(),
  };
  tracing::info!(
    marketplace_id,
    fulfillment = counts.fulfillment,
    payment = counts.payment,
    returns = counts.returns,
    locations = counts.locations,
    missing = ?missing,
    "loaded eBay seller policy setup"
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
    counts,
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
  post,
  path = "/ebay/locations",
  tag = "ebay",
  security(("internal_user" = []), ("internal_org" = [])),
  request_body = CreateEbayLocationRequest,
  responses(
    (status = 200, description = "Created eBay inventory location", body = EbayLocationOption),
    (status = 400, description = "Bad request", body = ErrorEnvelope),
    (status = 502, description = "eBay API failed", body = ErrorEnvelope)
  )
)]
async fn create_ebay_location(
  State(state): State<AppState>,
  org: OrgId,
  Json(req): Json<CreateEbayLocationRequest>,
) -> Result<Json<EbayLocationOption>, ApiError> {
  let name = cleaned_field(&req.name);
  let address_line1 = cleaned_field(&req.address_line1);
  let city = cleaned_field(&req.city);
  let state_or_province = cleaned_field(&req.state_or_province);
  let postal_code = cleaned_field(&req.postal_code);
  let country = inferred_location_country(&req.country, &postal_code);
  let has_postal_address = !postal_code.is_empty();
  let has_city_region_address = !city.is_empty() && !state_or_province.is_empty();
  if name.is_empty() || (!has_postal_address && !has_city_region_address) {
    return Err(error::bad_request("name and postal_code are required"));
  }

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

  let normalized_req = CreateEbayLocationRequest {
    name: name.clone(),
    address_line1,
    city,
    state_or_province,
    postal_code,
    country,
  };
  let key = merchant_location_key(&normalized_req);
  let inventory = EbayInventory {
    cfg,
    access_token: &bearer,
  };
  inventory
    .create_inventory_location(&EbayCreateInventoryLocationRequest {
      merchant_location_key: key.clone(),
      name: name.clone(),
      address_line1: (!normalized_req.address_line1.is_empty())
        .then_some(normalized_req.address_line1),
      city: (!normalized_req.city.is_empty()).then_some(normalized_req.city),
      state_or_province: (!normalized_req.state_or_province.is_empty())
        .then_some(normalized_req.state_or_province),
      postal_code: (!normalized_req.postal_code.is_empty()).then_some(normalized_req.postal_code),
      country: normalized_req.country,
    })
    .await
    .map_err(map_inventory_err)?;

  Ok(Json(EbayLocationOption { key, name }))
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
    .and_then(|value| normalize_location_key(Some(value)));

  if marketplace_id.is_empty()
    || fulfillment_policy_id.is_empty()
    || payment_policy_id.is_empty()
    || return_policy_id.is_empty()
  {
    return Err(error::bad_request(
      "marketplace_id, fulfillment_policy_id, payment_policy_id, and return_policy_id are required",
    ));
  }
  if merchant_location_key.is_none() {
    return Err(error::bad_request(
      "merchant_location_key is required for eBay publish-ready offers",
    ));
  }

  let policies = fetch_ebay_policies(&state, org.as_ref(), marketplace_id).await?;
  let merchant_location_key = validate_policy_selection(
    marketplace_id,
    &policies.fulfillment_policies,
    &policies.payment_policies,
    &policies.return_policies,
    &policies.locations,
    fulfillment_policy_id,
    payment_policy_id,
    return_policy_id,
    merchant_location_key.as_deref(),
  )
  .map_err(|e| error::bad_request(&e.to_string()))?;

  let saved = ebay_policy_defaults::upsert(
    &state.pool,
    &EbayPolicyDefaults {
      org_id: org.as_ref().to_string(),
      marketplace_id: marketplace_id.to_string(),
      fulfillment_policy_id: fulfillment_policy_id.to_string(),
      payment_policy_id: payment_policy_id.to_string(),
      return_policy_id: return_policy_id.to_string(),
      merchant_location_key: Some(merchant_location_key),
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
      if let Some(message) = oauth::parse_oauth_error_body(&body) {
        error::bad_gateway(message)
      } else {
        error::bad_gateway(public_ebay_api_error(status, body))
      }
    }
    _ => error::bad_gateway("ebay token request failed"),
  }
}

fn map_account_err(e: EbayAccountError) -> ApiError {
  match e {
    EbayAccountError::NoMatchingFulfillmentPolicy { .. } => ApiError::bad_request(e.to_string()),
    EbayAccountError::Api { status, body } => {
      let message = ebay_error_message(&body).unwrap_or(body);
      if message.to_ascii_lowercase().contains("business polic") {
        ApiError::bad_gateway(
          "eBay seller account is not eligible for Business Policies yet. Enable Seller Hub/Business Policies in eBay, then create or edit a shipping fulfillment policy.",
        )
      } else {
        ApiError::bad_gateway(public_ebay_api_error(status, message))
      }
    }
    EbayAccountError::Http(_) | EbayAccountError::Json(_) => ApiError::bad_gateway(e.to_string()),
  }
}

fn map_inventory_err(e: EbayInventoryError) -> ApiError {
  match e {
    EbayInventoryError::Api { status, body } => {
      let message = ebay_error_message(&body).unwrap_or(body);
      let lower = message.to_ascii_lowercase();
      if lower.contains("scope") || lower.contains("authorization") || lower.contains("oauth") {
        ApiError::bad_gateway(
          "Reconnect eBay so Clawpify can create ship-from locations for this seller account.",
        )
      } else {
        ApiError::bad_gateway(public_ebay_api_error(status, message))
      }
    }
    EbayInventoryError::Http(_)
    | EbayInventoryError::Json(_)
    | EbayInventoryError::MissingField(_)
    | EbayInventoryError::RequestClone => ApiError::bad_gateway(e.to_string()),
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
    create_ebay_location,
    save_ebay_policy_defaults
  ),
  components(schemas(
    EbayCallbackQuery,
    EbayOAuthStartResponse,
    EbayStatusResponse,
    EbaySellerSetupQuery,
    EbaySellerSetupResponse,
    EbayPolicyCounts,
    EbayPoliciesResponse,
    CreateEbayLocationRequest,
    SaveEbayPolicyDefaultsRequest,
    EbayLocationOption,
    EbayPolicyDefaults
  ))
)]
pub struct EbayOpenApiDoc;
