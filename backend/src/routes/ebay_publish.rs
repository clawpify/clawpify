use axum::{
  extract::{Path, State},
  middleware,
  routing::post,
  Json, Router,
};
use uuid::Uuid;

use super::extractors::OrgId;
use super::state::AppState;
use crate::error::{self, ApiError};
use crate::integrations::ebay::listing_service::{
  EbayDraftRequest, EbayDraftResponse, EbayListingService, EbayListingServiceError,
  EbayPublishResponse,
};
use crate::middleware as mw;

pub fn routes() -> Router<AppState> {
  Router::new()
    .route(
      "/listings/:listing_id/publish/ebay",
      post(publish_listing_to_ebay),
    )
    .route("/listings/:listing_id/ebay/draft", post(create_ebay_draft))
    .route(
      "/listings/:listing_id/ebay/publish",
      post(publish_ebay_draft),
    )
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

#[utoipa::path(
  post,
  path = "/listings/{listing_id}/ebay/draft",
  tag = "ebay",
  security(("internal_user" = []), ("internal_org" = [])),
  params(("listing_id" = Uuid, Path, description = "Listing id")),
  request_body = EbayDraftRequest,
  responses(
    (status = 200, description = "Created or reused an unpublished eBay offer", body = EbayDraftResponse),
    (status = 400, description = "Bad request", body = ErrorEnvelope),
    (status = 404, description = "Listing not found", body = ErrorEnvelope),
    (status = 409, description = "Listing already published on eBay", body = ErrorEnvelope),
    (status = 502, description = "eBay API failed", body = ErrorEnvelope)
  )
)]
async fn create_ebay_draft(
  State(state): State<AppState>,
  org: OrgId,
  Path(listing_id): Path<Uuid>,
  Json(request): Json<EbayDraftRequest>,
) -> Result<Json<EbayDraftResponse>, ApiError> {
  let service = ebay_listing_service(&state)?;
  let out = service
    .create_draft(org.as_ref(), listing_id, request)
    .await
    .map_err(map_ebay_listing_error)?;
  Ok(Json(out))
}

#[utoipa::path(
  post,
  path = "/listings/{listing_id}/ebay/publish",
  tag = "ebay",
  security(("internal_user" = []), ("internal_org" = [])),
  params(("listing_id" = Uuid, Path, description = "Listing id")),
  responses(
    (status = 200, description = "Published pending eBay draft", body = EbayPublishResponse),
    (status = 400, description = "Bad request", body = ErrorEnvelope),
    (status = 404, description = "Listing not found", body = ErrorEnvelope),
    (status = 502, description = "eBay API failed", body = ErrorEnvelope)
  )
)]
async fn publish_ebay_draft(
  State(state): State<AppState>,
  org: OrgId,
  Path(listing_id): Path<Uuid>,
) -> Result<Json<EbayPublishResponse>, ApiError> {
  let service = ebay_listing_service(&state)?;
  let out = service
    .publish_draft(org.as_ref(), listing_id)
    .await
    .map_err(map_ebay_listing_error)?;
  Ok(Json(out))
}

#[utoipa::path(
  post,
  path = "/listings/{listing_id}/publish/ebay",
  tag = "ebay",
  security(("internal_user" = []), ("internal_org" = [])),
  params(("listing_id" = Uuid, Path, description = "Listing id")),
  request_body = EbayDraftRequest,
  responses(
    (status = 200, description = "Legacy one-shot draft and publish", body = serde_json::Value),
    (status = 400, description = "Bad request", body = ErrorEnvelope),
    (status = 404, description = "Listing not found", body = ErrorEnvelope),
    (status = 409, description = "Listing already published on eBay", body = ErrorEnvelope),
    (status = 502, description = "eBay API failed", body = ErrorEnvelope)
  )
)]
async fn publish_listing_to_ebay(
  State(state): State<AppState>,
  org: OrgId,
  Path(listing_id): Path<Uuid>,
  Json(request): Json<EbayDraftRequest>,
) -> Result<Json<serde_json::Value>, ApiError> {
  let service = ebay_listing_service(&state)?;
  let draft = service
    .create_draft(org.as_ref(), listing_id, request)
    .await
    .map_err(map_ebay_listing_error)?;
  let published = service
    .publish_draft(org.as_ref(), listing_id)
    .await
    .map_err(map_ebay_listing_error)?;

  Ok(Json(serde_json::json!({
    "draft": draft,
    "publish": published,
  })))
}

fn ebay_listing_service(state: &AppState) -> Result<EbayListingService<'_>, ApiError> {
  let cfg = state
    .ebay_config
    .as_ref()
    .ok_or_else(|| error::internal("eBay not configured"))?;
  let crypto = state
    .token_crypto
    .as_ref()
    .ok_or_else(|| error::internal("CHANNEL_ENCRYPTION_KEY / token crypto"))?;

  Ok(EbayListingService {
    pool: &state.pool,
    cfg,
    crypto,
  })
}

fn map_ebay_listing_error(e: EbayListingServiceError) -> ApiError {
  match e {
    EbayListingServiceError::NotFound => error::not_found("Listing not found"),
    EbayListingServiceError::BadRequest(msg) => ApiError::bad_request(msg),
    EbayListingServiceError::Conflict(v) => ApiError::conflict(v.to_string()),
    EbayListingServiceError::Db(e) => error::db_error(e),
    EbayListingServiceError::Token(e) => ApiError::bad_request(e.to_string()),
    EbayListingServiceError::Inventory(e) => ApiError::bad_gateway(e.to_string()),
  }
}

#[derive(utoipa::OpenApi)]
#[openapi(
  paths(create_ebay_draft, publish_ebay_draft, publish_listing_to_ebay),
  components(schemas(EbayDraftRequest, EbayDraftResponse, EbayPublishResponse))
)]
pub struct EbayPublishOpenApiDoc;
