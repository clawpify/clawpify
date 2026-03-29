//! Twilio SMS/MMS webhooks for draft listings.
//!
//! Twilio signs requests with `X-Twilio-Signature`, but the scheme does **not** include a timestamp
//! or nonce. A captured valid request can be replayed until the signature format changes. We mitigate
//! duplicate **draft creates** by recording each inbound [`MessageSid`](https://www.twilio.com/docs/messaging/guides/webhook-request) in Postgres (`twilio_inbound_message_ids`); replays return the same user-facing success without a second listing insert.

use std::collections::BTreeMap;

use axum::{
  body::Bytes,
  extract::State,
  http::{HeaderMap, StatusCode},
  response::{IntoResponse, Response},
};
use serde_json::json;

use crate::dto::listings::CreateListingRequest;
use crate::integrations::twilio::signature;
use crate::repositories::intake_phone_bindings;
use crate::repositories::listings;
use crate::repositories::twilio_inbound;
use crate::routes::state::AppState;

fn xml_escape(s: &str) -> String {
  s.replace('&', "&amp;")
    .replace('<', "&lt;")
    .replace('>', "&gt;")
    .replace('"', "&quot;")
    .replace('\'', "&apos;")
}

fn twiml_message(msg: &str) -> String {
  format!(
    r#"<?xml version="1.0" encoding="UTF-8"?><Response><Message>{}</Message></Response>"#,
    xml_escape(msg)
  )
}

fn parse_form_params(body: &[u8]) -> BTreeMap<String, String> {
  let mut m = BTreeMap::new();
  for (k, v) in url::form_urlencoded::parse(body) {
    m.insert(k.into_owned(), v.into_owned());
  }
  m
}

fn intake_app_link() -> String {
  std::env::var("INTAKE_APP_URL").unwrap_or_else(|_| "https://clawpify.com/app/inventory".to_string())
}

pub async fn twilio_messaging(
  State(state): State<AppState>,
  headers: HeaderMap,
  body: Bytes,
) -> Response {
  let pool = &state.pool;
  let path = std::env::var("TWILIO_WEBHOOK_PATH").unwrap_or_else(|_| "/api/webhooks/twilio/messaging".to_string());
  let Ok(auth_token) = std::env::var("TWILIO_AUTH_TOKEN") else {
    tracing::error!(target: "twilio", "TWILIO_AUTH_TOKEN not set");
    return (StatusCode::SERVICE_UNAVAILABLE, "Twilio not configured").into_response();
  };

  let Some(sig) = headers
    .get("X-Twilio-Signature")
    .and_then(|h| h.to_str().ok())
  else {
    return (StatusCode::BAD_REQUEST, "Missing signature").into_response();
  };

  let params = parse_form_params(&body);

  let Ok(url) = signature::twilio_request_url(&headers, &path) else {
    return (StatusCode::BAD_REQUEST, "Bad webhook URL").into_response();
  };

  if let Err(e) = signature::verify_twilio_request(&auth_token, &url, &params, sig) {
    tracing::warn!(target: "twilio", "signature failed: {:?}", e);
    return (StatusCode::BAD_REQUEST, "Bad signature").into_response();
  }

  let from = params.get("From").cloned().unwrap_or_default();
  let from = from.trim().to_string();
  let body_text = params.get("Body").map(|s| s.trim().to_string()).filter(|s| !s.is_empty());

  let num_media: u32 = params
    .get("NumMedia")
    .and_then(|s| s.parse().ok())
    .unwrap_or(0);

  if from.is_empty() {
    return twiml_response("Missing caller phone.");
  }

  let binding = match intake_phone_bindings::get_by_phone_e164(pool, &from).await {
    Ok(Some(b)) => b,
    Ok(None) => {
      let link = intake_app_link();
      return twiml_response(&format!(
        "This number is not linked to Clawpify. Open the app and verify your phone for SMS intake: {link}"
      ));
    }
    Err(e) => {
      tracing::error!(target: "twilio", "binding lookup failed: {}", e);
      return twiml_response("Temporary error. Try again shortly.");
    }
  };

  if num_media == 0 {
    return twiml_response(
      "Send a photo (MMS) of your item to create a draft listing. You can add a short note in the SMS body.",
    );
  }

  let mut media_urls = Vec::new();
  for i in 0..num_media as usize {
    let key = format!("MediaUrl{i}");
    if let Some(u) = params.get(&key) {
      if !u.trim().is_empty() {
        media_urls.push(u.clone());
      }
    }
  }

  if media_urls.is_empty() {
    return twiml_response("Could not read the photo. Try sending the image again.");
  }

  let Some(message_sid) = params
    .get("MessageSid")
    .map(|s| s.trim())
    .filter(|s| !s.is_empty())
  else {
    tracing::warn!(target: "twilio", "MMS inbound missing MessageSid");
    return twiml_response("Could not process this message. Try sending the photo again.");
  };

  match twilio_inbound::try_record_message_sid(pool, message_sid, &binding.org_id).await {
    Ok(false) => {
      return twiml_response(
        "We already saved this photo from that message. Open Inventory in Clawpify to review.",
      );
    }
    Ok(true) => {}
    Err(e) => {
      tracing::error!(target: "twilio", "message sid dedupe insert failed: {}", e);
      return twiml_response("Temporary error. Try again shortly.");
    }
  }

  let title = body_text
    .as_deref()
    .map(|t| t.chars().take(160).collect::<String>())
    .filter(|s| !s.is_empty())
    .unwrap_or_else(|| "Photo draft".to_string());

  let media_json = json!(media_urls.iter().map(|u| json!(u)).collect::<Vec<_>>());

  let created = match listings::create(
    pool,
    &binding.org_id,
    Some(&binding.clerk_user_id),
    CreateListingRequest {
      title: Some(title),
      description_html: Some(String::new()),
      product_type: Some(String::new()),
      vendor: Some(String::new()),
      tags: Some(Vec::new()),
      price_cents: Some(0),
      suggested_price_cents: None,
      currency_code: Some("USD".to_string()),
      sku: None,
      media_urls: Some(media_json),
      status: Some("draft".to_string()),
      ai_quality: None,
      ai_attributes: None,
      consignor_id: None,
      contract_id: None,
      acceptance_status: None,
      decline_reason: None,
      post_contract_disposition: None,
    },
  )
  .await
  {
    Ok(row) => row,
    Err(e) => {
      tracing::error!(target: "twilio", "insert draft failed: {}", e);
      return twiml_response("Saved your photo but could not create the listing. Try again.");
    }
  };

  twiml_response(&format!(
    "Draft saved: {}. Open Inventory in Clawpify to review.",
    created.title
  ))
}

fn twiml_response(msg: &str) -> Response {
  let xml = twiml_message(msg);
  match Response::builder()
    .status(StatusCode::OK)
    .header(axum::http::header::CONTENT_TYPE, "application/xml; charset=utf-8")
    .body(axum::body::Body::from(xml))
  {
    Ok(r) => r,
    Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "twiml").into_response(),
  }
}
