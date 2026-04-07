//! Composed OpenAPI document and Swagger UI wiring helpers.
use std::collections::HashMap;

use utoipa::openapi::security::{ApiKey, ApiKeyValue, SecurityScheme};
use utoipa::openapi::{OpenApi, Server};
use utoipa::{Modify, OpenApi as OpenApiTrait};

use super::{
  activity, app_redirect, consignors, contracts, ebay, health, intake, listings, llm, s3,
  spa_hop, subscribers, webhooks,
};
use crate::error::ErrorEnvelope;

/// Registers `X-Internal-*` API keys used by the BFF / proxy.
struct SecurityAddon;

impl Modify for SecurityAddon {
  fn modify(&self, openapi: &mut OpenApi) {
    let components = openapi.components.get_or_insert_with(utoipa::openapi::Components::new);
    components.add_security_scheme(
      "internal_user",
      SecurityScheme::ApiKey(ApiKey::Header(ApiKeyValue::new("X-Internal-User-Id"))),
    );
    components.add_security_scheme(
      "internal_org",
      SecurityScheme::ApiKey(ApiKey::Header(ApiKeyValue::new("X-Internal-Org-Id"))),
    );
  }
}

#[derive(OpenApiTrait)]
#[openapi(
  info(
    title = "Clawpify API",
    version = "1.0.0",
    description = "Versioned HTTP API. Authenticated routes expect internal proxy headers (`X-Internal-User-Id`, `X-Internal-Org-Id`) unless noted. OAuth callbacks and webhooks use their own verification."
  ),
  modifiers(&SecurityAddon),
  components(schemas(ErrorEnvelope)),
  tags(
    (name = "meta", description = "Health and API metadata"),
    (name = "listings", description = "Consignment listings"),
    (name = "consignors", description = "Consignors"),
    (name = "contracts", description = "Contracts and payouts"),
    (name = "intake", description = "Intake phone bindings and batches"),
    (name = "activity", description = "Agent activity log"),
    (name = "subscribers", description = "Public waitlist"),
    (name = "llm", description = "LLM agent runs"),
    (name = "s3", description = "Object storage (S3)"),
    (name = "ebay", description = "eBay OAuth"),
    (name = "redirects", description = "SPA deep-link redirects"),
    (name = "webhooks", description = "Integration webhooks")
  ),
)]
pub struct ApiRoot;

fn merged_spec() -> OpenApi {
  let mut doc = ApiRoot::openapi();
  doc.merge(health::HealthOpenApiDoc::openapi());
  doc.merge(listings::ListingsOpenApiDoc::openapi());
  doc.merge(consignors::ConsignorsOpenApiDoc::openapi());
  doc.merge(contracts::ContractsOpenApiDoc::openapi());
  doc.merge(intake::IntakeOpenApiDoc::openapi());
  doc.merge(activity::ActivityOpenApiDoc::openapi());
  doc.merge(subscribers::SubscribersOpenApiDoc::openapi());
  doc.merge(llm::LlmOpenApiDoc::openapi());
  doc.merge(s3::S3OpenApiDoc::openapi());
  doc.merge(ebay::EbayOpenApiDoc::openapi());
  doc.merge(app_redirect::AppRedirectOpenApiDoc::openapi());
  doc.merge(spa_hop::SpaHopOpenApiDoc::openapi());
  doc.merge(webhooks::WebhooksOpenApiDoc::openapi());
  doc
}

fn apply_servers(doc: &mut OpenApi) {
  let url = std::env::var("OPENAPI_SERVER_URL").unwrap_or_else(|_| {
    "https://clawpify.ngrok.io/api/v1".to_string()
  });
  doc.servers = Some(vec![Server::new(url)]);
}

/// Optional [Scalar](https://scalar.com) hints on the info object (`x-scalar`).
fn apply_scalar_extension(doc: &mut OpenApi) {
  let ext = doc.info.extensions.get_or_insert_with(HashMap::new);
  ext.insert(
    "x-scalar".to_string(),
    serde_json::json!({
      "layout": "modern",
      "hideDownloadButton": false,
      "metaData": {
        "title": "Clawpify API"
      }
    }),
  );
}

/// Full OpenAPI 3 document for `/api/v1/*` (also mirrored under `/api/*`).
pub fn openapi_spec() -> OpenApi {
  let mut doc = merged_spec();
  apply_servers(&mut doc);
  apply_scalar_extension(&mut doc);
  doc
}
