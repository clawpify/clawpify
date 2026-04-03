//! S3 object routes: auth, missing config, and opt-in live bucket + OpenAI e2e.

mod common;

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use base64::Engine;
use serde_json::{json, Value};
use sqlx::PgPool;
use tower::ServiceExt;
use url::form_urlencoded::Serializer;

use backend::routes::api_router;
use common::{ensure_org, json_from_body};

fn s3_objects_uri() -> &'static str {
  "/api/v1/s3/objects"
}

#[sqlx::test(migrations = "../migrations")]
async fn s3_upload_unauthorized_without_user(pool: PgPool) {
  let app = api_router(pool);
  let res = app
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(s3_objects_uri())
        .header(header::CONTENT_TYPE, "application/octet-stream")
        .body(Body::from(vec![0u8; 5]))
        .unwrap(),
    )
    .await
    .expect("request");
  assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../migrations")]
async fn s3_upload_service_unavailable_without_bucket_env(pool: PgPool) {
  ensure_org(&pool, "org-s3-smoke").await;

  let app = api_router(pool);
  let res = app
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(s3_objects_uri())
        .header(header::CONTENT_TYPE, "image/png")
        .header("X-Internal-User-Id", "user-s3-1")
        .header("X-Internal-Org-Id", "org-s3-smoke")
        .body(Body::from(vec![0u8; 10]))
        .unwrap(),
    )
    .await
    .expect("request");

  assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
}

/// Live bucket + OpenAI. Runs when every var is set; otherwise skips (passes) with a line on stderr.
#[sqlx::test(migrations = "../migrations")]
async fn s3_e2e_ai_image_upload_download_delete(pool: PgPool) {
  const REQUIRED: &[&str] = &[
    "OPENAI_API_KEY",
    "ENDPOINT",
    "REGION",
    "BUCKET",
    "RAILWAY_BUCKET_ID",
    "BUCKET_SECRET",
  ];
  let missing: Vec<&str> = REQUIRED
    .iter()
    .copied()
    .filter(|v| std::env::var(v).map(|s| s.trim().is_empty()).unwrap_or(true))
    .collect();
  if !missing.is_empty() {
    eprintln!(
      "s3_e2e_ai_image_upload_download_delete: skip (unset or empty: {})",
      missing.join(", ")
    );
    return;
  }

  ensure_org(&pool, "org-s3-e2e").await;

  let openai_key = std::env::var("OPENAI_API_KEY").unwrap();
  let client_http = reqwest::Client::builder()
    .redirect(reqwest::redirect::Policy::none())
    .build()
    .expect("reqwest");

  let img_res = client_http
    .post("https://api.openai.com/v1/images/generations")
    .header("Authorization", format!("Bearer {openai_key}"))
    .header("Content-Type", "application/json")
    .json(&json!({
      "model": "dall-e-2",
      "prompt": "minimal abstract color blocks for upload smoke test",
      "n": 1,
      "size": "256x256",
      "response_format": "b64_json"
    }))
    .send()
    .await
    .expect("openai images");
  assert!(
    img_res.status().is_success(),
    "openai error: {}",
    img_res.text().await.unwrap_or_default()
  );
  let img_json: Value = img_res.json().await.expect("openai json");
  let b64 = img_json["data"][0]["b64_json"]
    .as_str()
    .expect("b64_json");
  let bytes = base64::engine::general_purpose::STANDARD
    .decode(b64.as_bytes())
    .expect("decode png");
  assert!(
    bytes.len() >= 100 && bytes.len() <= 2_000_000,
    "unexpected image size {}",
    bytes.len()
  );

  let app = api_router(pool);
  let org = "org-s3-e2e";
  let user = "user-s3-e2e";

  let q = Serializer::new(String::new())
    .append_pair("file_name", "ai-smoke.png")
    .finish();
  let upload_path = format!("{}?{}", s3_objects_uri(), q);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(&upload_path)
        .header(header::CONTENT_TYPE, "image/png")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(bytes.clone()))
        .unwrap(),
    )
    .await
    .expect("upload");
  assert_eq!(res.status(), StatusCode::OK, "POST /s3/objects failed");
  let prep: Value = json_from_body(res.into_body()).await;
  let object_key = prep["key"].as_str().expect("key");
  assert_eq!(
    prep["byte_size"].as_u64(),
    Some(bytes.len() as u64),
    "byte_size"
  );

  let dq = Serializer::new(String::new())
    .append_pair("key", object_key)
    .finish();
  let dl_path = format!("/api/v1/s3/objects?{}", dq);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("GET")
        .uri(&dl_path)
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("download");
  assert_eq!(res.status(), StatusCode::OK);
  assert_eq!(
    res.headers()
      .get(header::CONTENT_TYPE)
      .and_then(|v| v.to_str().ok()),
    Some("image/png")
  );
  let downloaded = axum::body::to_bytes(res.into_body(), usize::MAX)
    .await
    .expect("body");
  assert_eq!(downloaded.as_ref(), bytes.as_slice());

  let del_q = Serializer::new(String::new())
    .append_pair("key", object_key)
    .finish();
  let del_path = format!("/api/v1/s3/objects?{}", del_q);

  let res = app
    .oneshot(
      Request::builder()
        .method("DELETE")
        .uri(&del_path)
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("delete");
  assert_eq!(res.status(), StatusCode::NO_CONTENT);
}
