//! Listing ↔ stored_images attach, list, detach.

mod common;

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use serde_json::{json, Value};
use sqlx::PgPool;
use tower::ServiceExt;
use url::form_urlencoded::Serializer;
use uuid::Uuid;

use backend::repositories::stored_images;
use backend::routes::api_router;
use common::{ensure_org, json_from_body};

fn listings_uri(path_and_query: &str) -> String {
  format!("/api/v1/listings{path_and_query}")
}

#[sqlx::test(migrations = "../migrations")]
async fn listing_images_unauthorized(pool: PgPool) {
  ensure_org(&pool, "org-li-img").await;
  let id = Uuid::nil();
  let app = api_router(pool);
  let res = app
    .oneshot(
      Request::builder()
        .uri(listings_uri(&format!("/{id}/images")))
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("request");
  assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../migrations")]
async fn listing_images_attach_list_detach(pool: PgPool) {
  ensure_org(&pool, "org-li-attach").await;

  let org = "org-li-attach";
  let user = "user-li-1";

  let app = api_router(pool.clone());
  let create_body = json!({ "title": "With photos", "price_cents": 100 });
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
    .expect("create listing");
  assert_eq!(res.status(), StatusCode::CREATED);
  let created: Value = json_from_body(res.into_body()).await;
  let listing_id = Uuid::parse_str(created["id"].as_str().unwrap()).unwrap();

  let storage_key = format!("uploads/{org}/{user}/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee_test.png");
  stored_images::insert(
    &pool,
    org,
    user,
    &storage_key,
    "image/png",
    100,
    "test.png",
    None,
  )
  .await
  .expect("insert image row");

  let attach_uri = listings_uri(&format!("/{listing_id}/images"));
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(&attach_uri)
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(
          json!({ "storage_keys": [storage_key.clone()] }).to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("attach");
  assert_eq!(res.status(), StatusCode::NO_CONTENT);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(&attach_uri)
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("list images");
  assert_eq!(res.status(), StatusCode::OK);
  let images_val: Value = json_from_body(res.into_body()).await;
  let images = images_val.as_array().expect("images array");
  assert_eq!(images.len(), 1);
  assert_eq!(images[0]["storage_key"], storage_key);
  let expected_query = Serializer::new(String::new())
    .append_pair("key", &storage_key)
    .finish();
  assert_eq!(
    images[0]["url"],
    format!("/api/s3/objects?{expected_query}")
  );

  let q = Serializer::new(String::new())
    .append_pair("key", &storage_key)
    .finish();
  let del_uri = format!("{}{}", attach_uri, format!("?{q}"));
  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("DELETE")
        .uri(&del_uri)
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("detach");
  assert_eq!(res.status(), StatusCode::NO_CONTENT);

  let res = app
    .oneshot(
      Request::builder()
        .uri(&attach_uri)
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("list after detach");
  let images_val: Value = json_from_body(res.into_body()).await;
  let images = images_val.as_array().expect("images array");
  assert!(images.is_empty());
}
