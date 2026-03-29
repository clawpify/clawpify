//! HTTP integration tests for API routes (listings, intake, health, subscribers,
//! activity, LLM validation, Twilio webhook edge cases).

use std::collections::BTreeMap;
use std::sync::Mutex;

use axum::{
  body::Body,
  http::{header, Request, StatusCode},
};
use base64::Engine;
use hmac::{Hmac, Mac};
use serde_json::{json, Value};
use sha1::Sha1;
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

use backend::routes::api_router;

type HmacSha1 = Hmac<Sha1>;

/// Serialize Twilio env mutations — integration tests may run in parallel by default.
static TWILIO_TEST_LOCK: Mutex<()> = Mutex::new(());

async fn ensure_org(pool: &PgPool, org_id: &str) {
  sqlx::query("INSERT INTO organizations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING")
    .bind(org_id)
    .execute(pool)
    .await
    .expect("ensure org");
}

fn listings_uri(path_and_query: &str) -> String {
  format!("/api/listings{path_and_query}")
}

fn intake_uri(path_and_query: &str) -> String {
  format!("/api/intake{path_and_query}")
}

fn consignors_uri(path_and_query: &str) -> String {
  format!("/api/consignors{path_and_query}")
}

fn contracts_uri(path_and_query: &str) -> String {
  format!("/api/contracts{path_and_query}")
}

async fn json_from_body(body: Body) -> Value {
  let bytes = axum::body::to_bytes(body, usize::MAX)
    .await
    .expect("read body");
  if bytes.is_empty() {
    return Value::Null;
  }
  serde_json::from_slice(&bytes).expect("parse json body")
}

#[sqlx::test(migrations = "../migrations")]
async fn listings_unauthorized_without_user_header(pool: PgPool) {
  let app = api_router(pool.clone());
  let res = app
    .oneshot(
      Request::builder()
        .uri(listings_uri(""))
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("request");
  assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../migrations")]
async fn listings_crud_and_list_filter(pool: PgPool) {
  ensure_org(&pool, "org-api-listings").await;

  let app = api_router(pool.clone());
  let org = "org-api-listings";
  let user = "user-listings-1";

  let create_body = json!({ "title": "API Listing", "price_cents": 4200 });
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(listings_uri(""))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(create_body.to_string()))
        .unwrap(),
    )
    .await
    .expect("post listing");
  assert_eq!(res.status(), StatusCode::CREATED);
  let created: Value = json_from_body(res.into_body()).await;
  let id_str = created["id"].as_str().expect("listing id");
  let id = Uuid::parse_str(id_str).unwrap();
  assert_eq!(created["title"], "API Listing");

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(listings_uri(&format!("/{id}")))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("get listing");
  assert_eq!(res.status(), StatusCode::OK);
  let got: Value = json_from_body(res.into_body()).await;
  assert_eq!(got["title"], "API Listing");

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(listings_uri("?status=draft&limit=20"))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("list draft");
  assert_eq!(res.status(), StatusCode::OK);
  let list: Vec<Value> = serde_json::from_value(json_from_body(res.into_body()).await).unwrap();
  assert!(
    list.iter().any(|row| row["id"].as_str() == Some(id_str)),
    "list should include created id when filtering draft"
  );

  let patch = json!({ "title": "Updated title", "status": "ready" });
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("PATCH")
        .uri(listings_uri(&format!("/{id}")))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(patch.to_string()))
        .unwrap(),
    )
    .await
    .expect("patch listing");
  assert_eq!(res.status(), StatusCode::OK);
  let updated: Value = json_from_body(res.into_body()).await;
  assert_eq!(updated["title"], "Updated title");
  assert_eq!(updated["status"], "ready");

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("DELETE")
        .uri(listings_uri(&format!("/{id}")))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("delete listing");
  assert_eq!(res.status(), StatusCode::OK);
  let del: Value = json_from_body(res.into_body()).await;
  assert_eq!(del["ok"], true);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(listings_uri(&format!("/{id}")))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("get deleted");
  assert_eq!(res.status(), StatusCode::NOT_FOUND);
}

#[sqlx::test(migrations = "../migrations")]
async fn listings_wrong_org_returns_not_found(pool: PgPool) {
  ensure_org(&pool, "org-a").await;
  ensure_org(&pool, "org-b").await;

  let app = api_router(pool.clone());
  let create_body = json!({ "title": "Secret", "status": "draft" });
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(listings_uri(""))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", "u1")
        .header("X-Internal-Org-Id", "org-a")
        .body(Body::from(create_body.to_string()))
        .unwrap(),
    )
    .await
    .expect("post");
  assert_eq!(res.status(), StatusCode::CREATED);
  let created: Value = json_from_body(res.into_body()).await;
  let id = created["id"].as_str().unwrap();

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(listings_uri(&format!("/{id}")))
        .header("X-Internal-User-Id", "u1")
        .header("X-Internal-Org-Id", "org-b")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("get other org");
  assert_eq!(res.status(), StatusCode::NOT_FOUND);
}

#[sqlx::test(migrations = "../migrations")]
async fn intake_phone_binding_put_get_delete(pool: PgPool) {
  ensure_org(&pool, "org-intake-api").await;

  let app = api_router(pool.clone());
  let org = "org-intake-api";
  let user = "user-intake-1";

  let body = json!({ "phone_e164": "+15551234567" });
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("PUT")
        .uri(intake_uri("/phone-binding"))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(body.to_string()))
        .unwrap(),
    )
    .await
    .expect("put binding");
  assert_eq!(res.status(), StatusCode::OK);
  let row: Value = json_from_body(res.into_body()).await;
  assert_eq!(row["phone_e164"], "+15551234567");

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(intake_uri("/phone-binding"))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("get bindings");
  assert_eq!(res.status(), StatusCode::OK);
  let list: Vec<Value> = serde_json::from_value(json_from_body(res.into_body()).await).unwrap();
  assert!(list.len() >= 1);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("DELETE")
        .uri(intake_uri("/phone-binding"))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("delete binding");
  assert_eq!(res.status(), StatusCode::OK);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("DELETE")
        .uri(intake_uri("/phone-binding"))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("delete again");
  assert_eq!(res.status(), StatusCode::NOT_FOUND);
}

fn twilio_sign_url_params(auth_token: &str, url: &str, params: &BTreeMap<String, String>) -> String {
  let mut payload = String::with_capacity(url.len() + params.len() * 32);
  payload.push_str(url);
  for (k, v) in params {
    payload.push_str(k);
    payload.push_str(v);
  }
  let mut mac = HmacSha1::new_from_slice(auth_token.as_bytes()).expect("hmac key");
  mac.update(payload.as_bytes());
  base64::engine::general_purpose::STANDARD.encode(mac.finalize().into_bytes())
}

#[sqlx::test(migrations = "../migrations")]
async fn health_ok(_pool: PgPool) {
  let app = api_router(_pool);
  let res = app
    .oneshot(
      Request::builder()
        .uri("/api/health")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("health");
  assert_eq!(res.status(), StatusCode::OK);
  let v: Value = json_from_body(res.into_body()).await;
  assert_eq!(v["ok"], true);
  assert_eq!(v["service"], "clawpify-backend");
}

#[sqlx::test(migrations = "../migrations")]
async fn subscribers_validation_and_subscribe(pool: PgPool) {
  let app = api_router(pool.clone());

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/subscribers")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(json!({ "email": "" }).to_string()))
        .unwrap(),
    )
    .await
    .expect("empty email");
  assert_eq!(res.status(), StatusCode::BAD_REQUEST);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/subscribers")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(json!({ "email": "not-an-email" }).to_string()))
        .unwrap(),
    )
    .await
    .expect("bad email");
  assert_eq!(res.status(), StatusCode::BAD_REQUEST);

  let email = "waitlist-api-test@example.com";
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/subscribers")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(json!({ "email": email }).to_string()))
        .unwrap(),
    )
    .await
    .expect("subscribe");
  assert_eq!(res.status(), StatusCode::OK);
  let v: Value = json_from_body(res.into_body()).await;
  assert_eq!(v["ok"], true);
  assert!(v.get("already_subscribed").is_none());

  let res = app
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/subscribers")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(json!({ "email": email }).to_string()))
        .unwrap(),
    )
    .await
    .expect("resubscribe");
  assert_eq!(res.status(), StatusCode::OK);
  let v: Value = json_from_body(res.into_body()).await;
  assert_eq!(v["ok"], true);
  assert_eq!(v["already_subscribed"], true);
}

#[sqlx::test(migrations = "../migrations")]
async fn agent_activity_unauthorized_without_user_header(pool: PgPool) {
  let app = api_router(pool);
  let res = app
    .oneshot(
      Request::builder()
        .uri("/api/agent-activity")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("list activity");
  assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../migrations")]
async fn agent_activity_log_and_list(pool: PgPool) {
  ensure_org(&pool, "org-activity-api").await;

  let app = api_router(pool.clone());
  let org = "org-activity-api";
  let user = "user-activity-1";

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri("/api/agent-activity")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("list empty");
  assert_eq!(res.status(), StatusCode::OK);
  let list: Vec<Value> = serde_json::from_value(json_from_body(res.into_body()).await).unwrap();
  assert!(list.is_empty());

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/agent-activity")
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(
          json!({
            "agent_name": "",
            "action_type": "test"
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("bad activity");
  assert_eq!(res.status(), StatusCode::BAD_REQUEST);

  let body = json!({
    "agent_name": "test-agent",
    "action_type": "test_action",
    "payload": { "k": 1 }
  });
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/agent-activity")
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(body.to_string()))
        .unwrap(),
    )
    .await
    .expect("log activity");
  assert_eq!(res.status(), StatusCode::OK);
  let row: Value = json_from_body(res.into_body()).await;
  let id = row["id"].as_str().unwrap().to_string();
  assert_eq!(row["agent_name"], "test-agent");
  assert_eq!(row["action_type"], "test_action");

  let res = app
    .oneshot(
      Request::builder()
        .uri("/api/agent-activity")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("list after");
  assert_eq!(res.status(), StatusCode::OK);
  let list: Vec<Value> = serde_json::from_value(json_from_body(res.into_body()).await).unwrap();
  assert!(list.iter().any(|r| r["id"].as_str() == Some(&id)));
}

#[sqlx::test(migrations = "../migrations")]
async fn llm_agents_unauthorized_without_user_header(pool: PgPool) {
  let app = api_router(pool);
  let res = app
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/llm/agents")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(
          json!({
            "agents": [{ "id": "x", "prompt": "y", "web_search": false }]
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("llm agents");
  assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../migrations")]
async fn llm_agents_rejects_empty_agents(pool: PgPool) {
  let app = api_router(pool);
  let res = app
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/llm/agents")
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", "u-llm-1")
        .header("X-Internal-Org-Id", "org-llm-1")
        .body(Body::from(json!({ "agents": [] }).to_string()))
        .unwrap(),
    )
    .await
    .expect("empty agents");
  assert_eq!(res.status(), StatusCode::BAD_REQUEST);
}

#[sqlx::test(migrations = "../migrations")]
async fn twilio_webhook_requires_signature_when_configured(pool: PgPool) {
  let _lock = TWILIO_TEST_LOCK.lock().expect("twilio lock");
  std::env::set_var("TWILIO_AUTH_TOKEN", "test_auth_token_for_integration");
  std::env::set_var(
    "TWILIO_WEBHOOK_URL",
    "https://twilio.test/api/webhooks/twilio/messaging",
  );
  std::env::remove_var("TWILIO_WEBHOOK_PATH");

  let app = api_router(pool);
  let body = b"From=%2B15550001001&NumMedia=0".as_slice();

  let res = app
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/webhooks/twilio/messaging")
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .body(Body::from(body))
        .unwrap(),
    )
    .await
    .expect("twilio post");
  assert_eq!(res.status(), StatusCode::BAD_REQUEST);
  let text = String::from_utf8(axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap().to_vec()).unwrap();
  assert!(text.contains("Missing signature"), "body={text:?}");

  std::env::remove_var("TWILIO_AUTH_TOKEN");
  std::env::remove_var("TWILIO_WEBHOOK_URL");
}

#[sqlx::test(migrations = "../migrations")]
async fn twilio_webhook_rejects_bad_signature(pool: PgPool) {
  let _lock = TWILIO_TEST_LOCK.lock().expect("twilio lock");
  std::env::set_var("TWILIO_AUTH_TOKEN", "test_auth_token_for_integration");
  std::env::set_var(
    "TWILIO_WEBHOOK_URL",
    "https://twilio.test/api/webhooks/twilio/messaging",
  );

  let app = api_router(pool);
  let body = b"From=%2B15550001002&NumMedia=0".as_slice();

  let res = app
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/webhooks/twilio/messaging")
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .header("X-Twilio-Signature", "AAAA")
        .body(Body::from(body))
        .unwrap(),
    )
    .await
    .expect("twilio bad sig");
  assert_eq!(res.status(), StatusCode::BAD_REQUEST);

  std::env::remove_var("TWILIO_AUTH_TOKEN");
  std::env::remove_var("TWILIO_WEBHOOK_URL");
}

#[sqlx::test(migrations = "../migrations")]
async fn twilio_webhook_bound_phone_num_media_zero_asks_for_photo(pool: PgPool) {
  let _lock = TWILIO_TEST_LOCK.lock().expect("twilio lock");
  std::env::set_var("TWILIO_AUTH_TOKEN", "test_auth_token_for_integration");
  let webhook_url = "https://twilio.test/api/webhooks/twilio/messaging";
  std::env::set_var("TWILIO_WEBHOOK_URL", webhook_url);

  ensure_org(&pool, "org-twilio-api").await;
  sqlx::query(
    r#"INSERT INTO intake_phone_bindings (org_id, clerk_user_id, phone_e164)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone_e164) DO NOTHING"#,
  )
  .bind("org-twilio-api")
  .bind("user_twilio_sms")
  .bind("+15550001003")
  .execute(&pool)
  .await
  .expect("seed binding");

  let mut params = BTreeMap::new();
  params.insert("From".to_string(), "+15550001003".to_string());
  params.insert("NumMedia".to_string(), "0".to_string());
  let sig = twilio_sign_url_params(
    "test_auth_token_for_integration",
    webhook_url,
    &params,
  );
  let body_str = "From=%2B15550001003&NumMedia=0";

  let app = api_router(pool);
  let res = app
    .oneshot(
      Request::builder()
        .method("POST")
        .uri("/api/webhooks/twilio/messaging")
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .header("X-Twilio-Signature", &sig)
        .body(Body::from(body_str))
        .unwrap(),
    )
    .await
    .expect("twilio mms hint");
  assert_eq!(res.status(), StatusCode::OK);
  let text = String::from_utf8(axum::body::to_bytes(res.into_body(), usize::MAX).await.unwrap().to_vec()).unwrap();
  assert!(
    text.contains("Send a photo") || text.contains("photo"),
    "expected MMS prompt in: {text}"
  );

  std::env::remove_var("TWILIO_AUTH_TOKEN");
  std::env::remove_var("TWILIO_WEBHOOK_URL");
}

#[sqlx::test(migrations = "../migrations")]
async fn consignment_consignor_contract_payout_listing_flow(pool: PgPool) {
  ensure_org(&pool, "org-consign").await;
  let org = "org-consign";
  let user = "user-consign-1";
  let app = api_router(pool.clone());

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(consignors_uri(""))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(
          json!({ "display_name": "Alice Vintage" }).to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("create consignor");
  assert_eq!(res.status(), StatusCode::CREATED);
  let cons: Value = json_from_body(res.into_body()).await;
  let consignor_id = cons["id"].as_str().expect("consignor id");

  let start = "2026-01-01T00:00:00Z";
  let end = "2026-03-01T00:00:00Z";
  let contract_body = json!({
    "consignor_id": consignor_id,
    "contract_type": "donate_on",
    "start_at": start,
    "end_at": end,
    "consignor_split_bps": 4000,
    "store_split_bps": 6000
  });
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(contracts_uri(""))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(contract_body.to_string()))
        .unwrap(),
    )
    .await
    .expect("create contract");
  assert_eq!(res.status(), StatusCode::CREATED);
  let ctr: Value = json_from_body(res.into_body()).await;
  let contract_id = ctr["id"].as_str().expect("contract id");

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("DELETE")
        .uri(consignors_uri(&format!("/{consignor_id}")))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("delete consignor blocked");
  assert_eq!(res.status(), StatusCode::CONFLICT);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(contracts_uri(&format!(
          "?consignor_id={consignor_id}&status=active"
        )))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("list contracts");
  assert_eq!(res.status(), StatusCode::OK);
  let ctr_list: Vec<Value> = serde_json::from_value(json_from_body(res.into_body()).await).unwrap();
  assert!(ctr_list.iter().any(|r| r["id"].as_str() == Some(contract_id)));

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(contracts_uri(&format!("/{contract_id}/payouts")))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(
          json!({ "amount_cents": 500, "method": "cash", "payout_index": 1 }).to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("payout too small");
  assert_eq!(res.status(), StatusCode::BAD_REQUEST);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(contracts_uri(&format!("/{contract_id}/payouts")))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(
          json!({ "amount_cents": 1500, "method": "e_transfer", "payout_index": 1 }).to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("payout 1");
  assert_eq!(res.status(), StatusCode::CREATED);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(contracts_uri(&format!("/{contract_id}/payouts")))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(
          json!({ "amount_cents": 2000, "method": "cash", "payout_index": 2 }).to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("payout 2");
  assert_eq!(res.status(), StatusCode::CREATED);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(contracts_uri(&format!("/{contract_id}/payouts")))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(
          json!({ "amount_cents": 3000, "method": "cash", "payout_index": 1 }).to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("third payout");
  assert_eq!(res.status(), StatusCode::BAD_REQUEST);

  let create_listing = json!({ "title": "Coat", "price_cents": 8000, "contract_id": contract_id });
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(listings_uri(""))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(create_listing.to_string()))
        .unwrap(),
    )
    .await
    .expect("listing with contract");
  assert_eq!(res.status(), StatusCode::CREATED);
  let listing: Value = json_from_body(res.into_body()).await;
  assert_eq!(listing["consignor_id"].as_str(), Some(consignor_id));

  let listing_id = listing["id"].as_str().unwrap();
  let bad_patch = json!({
    "contract_id": contract_id,
    "consignor_id": "00000000-0000-0000-0000-000000000001"
  });
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("PATCH")
        .uri(listings_uri(&format!("/{listing_id}")))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(bad_patch.to_string()))
        .unwrap(),
    )
    .await
    .expect("bad consignor");
  assert_eq!(res.status(), StatusCode::BAD_REQUEST);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(contracts_uri(&format!("/{contract_id}/run-expiry-rules")))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(
          json!({ "as_of": "2026-02-01T00:00:00Z" }).to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("run expiry early");
  assert_eq!(res.status(), StatusCode::BAD_REQUEST);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(contracts_uri(&format!("/{contract_id}/run-expiry-rules")))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(
          json!({ "as_of": "2026-04-01T00:00:00Z" }).to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("run expiry");
  assert_eq!(res.status(), StatusCode::OK);
  let exp: Value = json_from_body(res.into_body()).await;
  assert!(exp["updated"].as_u64().unwrap_or(0) >= 1);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(intake_uri("/batches"))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("list batches");
  assert_eq!(res.status(), StatusCode::OK);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(intake_uri("/batches"))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(
          json!({ "box_count": 2, "consignor_id": consignor_id }).to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("create batch");
  assert_eq!(res.status(), StatusCode::CREATED);
}
