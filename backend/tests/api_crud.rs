//! HTTP integration tests for internal-auth CRUD routes (listings, intake, stores).

use axum::{
  body::Body,
  http::{header, Request, StatusCode},
};
use serde_json::{json, Value};
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

use backend::routes::api_router;

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

fn stores_uri(path_and_query: &str) -> String {
  format!("/api/stores{path_and_query}")
}

fn intake_uri(path_and_query: &str) -> String {
  format!("/api/intake{path_and_query}")
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
  assert_eq!(res.status(), StatusCode::OK);
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
  assert_eq!(res.status(), StatusCode::OK);
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

#[sqlx::test(migrations = "../migrations")]
async fn stores_crud(pool: PgPool) {
  ensure_org(&pool, "org-stores-api").await;

  let app = api_router(pool.clone());
  let org = "org-stores-api";
  let user = "user-stores-1";

  let create_body = json!({
    "base_url": "https://example.com",
    "platform": "url"
  });
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(stores_uri(""))
        /* stores::create inserts org if missing; use consistent org */
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(create_body.to_string()))
        .unwrap(),
    )
    .await
    .expect("post store");
  assert_eq!(res.status(), StatusCode::OK);
  let created: Value = json_from_body(res.into_body()).await;
  let id_str = created["id"].as_str().expect("store id");
  let id = Uuid::parse_str(id_str).unwrap();

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(stores_uri(&format!("/{id}")))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("get store");
  assert_eq!(res.status(), StatusCode::OK);

  let patch = json!({
    "base_url": "https://updated.example.com",
    "platform": "url"
  });
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("PATCH")
        .uri(stores_uri(&format!("/{id}")))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(patch.to_string()))
        .unwrap(),
    )
    .await
    .expect("patch store");
  assert_eq!(res.status(), StatusCode::OK);
  let updated: Value = json_from_body(res.into_body()).await;
  assert_eq!(updated["platform"], "url");

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("DELETE")
        .uri(stores_uri(&format!("/{id}")))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("delete store");
  assert_eq!(res.status(), StatusCode::OK);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(stores_uri(&format!("/{id}")))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("get deleted store");
  assert_eq!(res.status(), StatusCode::NOT_FOUND);
}
