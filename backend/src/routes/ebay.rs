use axum::{
  extract::{Query, State},
  middleware,
  response::{IntoResponse, Redirect, Response},
  routing::get,
  Router,
};
use serde::Deserialize;

use super::extractors::OrgId;
use super::state::AppState;
use crate::error::{self, ApiError};
use crate::integrations::ebay::oauth::{self, EbayOAuthError};
use crate::integrations::ebay::state_token::{self, StateTokenError};
use crate::middleware as mw;
use crate::repositories::channel_connections;

#[derive(Deserialize)]
pub struct EbayCallbackQuery {
  code: Option<String>,
  state: Option<String>,
  error: Option<String>,
  error_description: Option<String>,
}

pub fn routes() -> Router<AppState> {
  let protected = Router::new()
    .route("/oauth/ebay/start", get(ebay_oauth_start))
    .route_layer(middleware::from_fn(mw::require_internal_auth));

  let public = Router::new().route("/oauth/ebay/callback", get(ebay_oauth_callback));

  protected.merge(public)
}

async fn ebay_oauth_start(
  State(state): State<AppState>,
  org: OrgId,
) -> Result<Response, ApiError> {
  let cfg = state
    .ebay_config
    .as_ref()
    .ok_or_else(|| error::internal("eBay OAuth is not configured"))?;

  let secret = std::env::var("OAUTH_STATE_SECRET").map_err(|_| error::internal("OAUTH_STATE_SECRET"))?;

  let st = state_token::sign_state(secret.as_bytes(), org.as_ref(), 900).map_err(|_| error::bad_request("state"))?;

  let url = oauth::authorize_url(cfg, &st);

  Ok(Redirect::temporary(&url).into_response())
}

async fn ebay_oauth_callback(
  State(state): State<AppState>,
  Query(q): Query<EbayCallbackQuery>,
) -> Result<Response, ApiError> {
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

  let code = q.code.ok_or_else(|| error::bad_request("missing code"))?;

  let state_tok = q.state.ok_or_else(|| error::bad_request("missing state"))?;

  let secret = std::env::var("OAUTH_STATE_SECRET").map_err(|_| error::internal("OAUTH_STATE_SECRET"))?;

  let payload =
    state_token::verify_state(secret.as_bytes(), &state_tok).map_err(|e| match e {
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
    &ct,
    &nonce,
    Some(exp),
  )
  .await
  .map_err(error::db_error)?;

  Ok(
    Redirect::temporary(&cfg.oauth_success_redirect).into_response(),
  )
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
