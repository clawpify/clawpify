//! HTTP integration tests for `/api/contracts` (auth, CRUD, summary).

mod common;

use axum::{
  body::Body,
  http::{header, Request, StatusCode},
};
use common::{ensure_org, json_from_body};
use serde_json::{json, Value};
use sqlx::PgPool;
use tower::ServiceExt;

use backend::routes::api_router;

fn consignors_uri(path_and_query: &str) -> String {
  format!("/api/v1/consignors{path_and_query}")
}

fn contracts_uri(path_and_query: &str) -> String {
  format!("/api/v1/contracts{path_and_query}")
}

#[sqlx::test(migrations = "../migrations")]
async fn contracts_unauthorized_without_user_header(pool: PgPool) {
  let app = api_router(pool);
  let res = app
    .oneshot(
      Request::builder()
        .uri(contracts_uri(""))
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("request");
  assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
}

#[sqlx::test(migrations = "../migrations")]
async fn contracts_crud_get_patch_and_summary(pool: PgPool) {
  ensure_org(&pool, "org-contracts-http-crud").await;
  let org = "org-contracts-http-crud";
  let user = "user-contracts-http-crud";
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
        .body(Body::from(json!({ "display_name": "CRUD Consignor" }).to_string()))
        .unwrap(),
    )
    .await
    .expect("create consignor");
  assert_eq!(res.status(), StatusCode::CREATED);
  let cons: Value = json_from_body(res.into_body()).await;
  let consignor_id = cons["id"].as_str().expect("consignor id");

  let start = "2026-01-01T00:00:00Z";
  let end = "2026-06-01T00:00:00Z";
  let contract_body = json!({
    "consignor_id": consignor_id,
    "contract_type": "pick_up",
    "start_at": start,
    "end_at": end,
    "consignor_split_bps": 4000,
    "store_split_bps": 6000,
    "notes": "original"
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
  let created: Value = json_from_body(res.into_body()).await;
  let contract_id = created["id"].as_str().expect("contract id");
  assert_eq!(created["status"], "active");
  assert_eq!(created["notes"], "original");

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(contracts_uri(&format!("/{contract_id}")))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("get contract");
  assert_eq!(res.status(), StatusCode::OK);
  let got: Value = json_from_body(res.into_body()).await;
  assert_eq!(got["id"].as_str(), Some(contract_id));
  assert_eq!(got["contract_type"], "pick_up");

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("PATCH")
        .uri(contracts_uri(&format!("/{contract_id}")))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(
          json!({
            "status": "closed",
            "notes": "settled",
            "terms_version": "v2"
          })
          .to_string(),
        ))
        .unwrap(),
    )
    .await
    .expect("patch contract");
  assert_eq!(res.status(), StatusCode::OK);
  let updated: Value = json_from_body(res.into_body()).await;
  assert_eq!(updated["status"], "closed");
  assert_eq!(updated["notes"], "settled");
  assert_eq!(updated["terms_version"], "v2");

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .method("PATCH")
        .uri(contracts_uri(&format!("/{contract_id}")))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(json!({ "status": "not_a_status" }).to_string()))
        .unwrap(),
    )
    .await
    .expect("bad status patch");
  assert_eq!(res.status(), StatusCode::BAD_REQUEST);

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(contracts_uri(&format!(
          "?consignor_id={consignor_id}&status=closed&limit=10"
        )))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("list contracts closed");
  assert_eq!(res.status(), StatusCode::OK);
  let list: Vec<Value> = serde_json::from_value(json_from_body(res.into_body()).await).unwrap();
  assert!(list.iter().any(|r| r["id"].as_str() == Some(contract_id)));

  let res = app
    .clone()
    .oneshot(
      Request::builder()
        .uri(contracts_uri(&format!("/{contract_id}/summary")))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("contract summary");
  assert_eq!(res.status(), StatusCode::OK);
  let summary: Value = json_from_body(res.into_body()).await;
  assert_eq!(summary["contract_id"].as_str(), Some(contract_id));
  assert_eq!(summary["listing_count"], 0);

  let res = app
    .oneshot(
      Request::builder()
        .uri(contracts_uri(&format!(
          "/00000000-0000-0000-0000-00000000abcd"
        )))
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .expect("get missing contract");
  assert_eq!(res.status(), StatusCode::NOT_FOUND);
}

#[sqlx::test(migrations = "../migrations")]
async fn contracts_create_idempotency_replays_same_contract(pool: PgPool) {
  ensure_org(&pool, "org-contracts-idem").await;
  let org = "org-contracts-idem";
  let user = "user-contracts-idem";
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
        .body(Body::from(json!({ "display_name": "Idem Consignor" }).to_string()))
        .unwrap(),
    )
    .await
    .expect("create consignor");
  assert_eq!(res.status(), StatusCode::CREATED);
  let cons: Value = json_from_body(res.into_body()).await;
  let consignor_id = cons["id"].as_str().expect("consignor id");

  let start = "2026-02-01T00:00:00Z";
  let end = "2026-08-01T00:00:00Z";
  let contract_body = json!({
    "consignor_id": consignor_id,
    "contract_type": "pick_up",
    "start_at": start,
    "end_at": end,
    "consignor_split_bps": 4000,
    "store_split_bps": 6000,
    "notes": "idem-note"
  });

  let mk_req = || {
    Request::builder()
      .method("POST")
      .uri(contracts_uri(""))
      .header(header::CONTENT_TYPE, "application/json")
      .header("Idempotency-Key", "contract-idem-1")
      .header("X-Internal-User-Id", user)
      .header("X-Internal-Org-Id", org)
      .body(Body::from(contract_body.to_string()))
      .unwrap()
  };

  let res = app.clone().oneshot(mk_req()).await.expect("create 1");
  assert_eq!(res.status(), StatusCode::CREATED);
  let c1: Value = json_from_body(res.into_body()).await;

  let res = app.clone().oneshot(mk_req()).await.expect("create 2");
  assert_eq!(res.status(), StatusCode::CREATED);
  let c2: Value = json_from_body(res.into_body()).await;

  assert_eq!(c1["id"], c2["id"]);

  let other_body = json!({
    "consignor_id": consignor_id,
    "contract_type": "pick_up",
    "start_at": start,
    "end_at": end,
    "consignor_split_bps": 4000,
    "store_split_bps": 6000,
    "notes": "different-note"
  });
  let res = app
    .oneshot(
      Request::builder()
        .method("POST")
        .uri(contracts_uri(""))
        .header(header::CONTENT_TYPE, "application/json")
        .header("Idempotency-Key", "contract-idem-1")
        .header("X-Internal-User-Id", user)
        .header("X-Internal-Org-Id", org)
        .body(Body::from(other_body.to_string()))
        .unwrap(),
    )
    .await
    .expect("mismatch body");
  assert_eq!(res.status(), StatusCode::CONFLICT);
}
