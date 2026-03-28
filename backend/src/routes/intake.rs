use axum::{
  middleware,
  routing::get,
  Extension, Json, Router,
};
use sqlx::PgPool;

use crate::auth;
use crate::dto::intake::{PhoneBindingResponse, UpsertPhoneBindingRequest};
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::repositories::intake_phone_bindings;
use crate::util::phone::parse_e164;

pub fn routes() -> Router {
  Router::new()
    .route(
      "/intake/phone-binding",
      get(get_bindings).put(put_binding).delete(delete_binding),
    )
    .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn get_bindings(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
) -> Result<Json<Vec<PhoneBindingResponse>>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let rows = intake_phone_bindings::list_for_org(&pool, &org_id)
    .await
    .map_err(error::db_error)?;
  Ok(Json(rows))
}

async fn put_binding(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
  Json(body): Json<UpsertPhoneBindingRequest>,
) -> Result<Json<PhoneBindingResponse>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let uid = auth::get_user_id(&headers)?;
  let phone = parse_e164(&body.phone_e164).map_err(error::bad_request)?;

  if intake_phone_bindings::phone_taken_by_other(&pool, &phone, &org_id, &uid)
    .await
    .map_err(error::db_error)?
  {
    return Err(error::bad_request(
      "That phone is already linked to another account or organization",
    ));
  }

  let row = intake_phone_bindings::upsert_for_user(&pool, &org_id, &uid, &phone)
    .await
    .map_err(|e| {
      if let sqlx::Error::Database(ref d) = e {
        if d.is_unique_violation() {
          return (
            axum::http::StatusCode::CONFLICT,
            axum::Json(serde_json::json!({ "error": "Phone conflict" })),
          );
        }
      }
      error::db_error(e)
    })?;

  Ok(Json(row))
}

async fn delete_binding(
  Extension(pool): Extension<PgPool>,
  headers: axum::http::HeaderMap,
) -> Result<Json<serde_json::Value>, ApiError> {
  let org_id = auth::get_org_id(&headers)?;
  let uid = auth::get_user_id(&headers)?;
  let deleted = intake_phone_bindings::delete_for_user(&pool, &org_id, &uid)
    .await
    .map_err(error::db_error)?;
  if !deleted {
    return Err(error::not_found("No phone binding for this user"));
  }
  Ok(Json(serde_json::json!({ "ok": true })))
}
