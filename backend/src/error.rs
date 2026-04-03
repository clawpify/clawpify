use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct ErrorEnvelope {
  pub error: ErrorFields,
}

#[derive(Debug, Clone, Serialize)]
pub struct ErrorFields {
  /* error_type: The type of error. */
  #[serde(rename = "type")]
  pub error_type: String,
  /* code: The code of the error. */
  pub code: String,
  /* message: The message of the error. */
  pub message: String,
  /* param: The parameter of the error. */
  #[serde(skip_serializing_if = "Option::is_none")]
  pub param: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ApiError {
  /* status: The status code of the error. */
  pub status: StatusCode,
  /* envelope: The envelope of the error. */
  envelope: ErrorEnvelope,
}

impl ApiError {
  fn new(
    status: StatusCode,
    error_type: &str,
    code: &str,
    message: impl Into<String>,
    param: Option<String>,
  ) -> Self {
    Self {
      status,
      envelope: ErrorEnvelope {
        error: ErrorFields {
          error_type: error_type.to_string(),
          code: code.to_string(),
          message: message.into(),
          param,
        },
      },
    }
  }

  pub fn bad_request(message: impl Into<String>) -> Self {
    Self::new(
      StatusCode::BAD_REQUEST,
      "invalid_request",
      "invalid_request",
      message,
      None,
    )
  }

  pub fn unauthorized(message: impl Into<String>) -> Self {
    Self::new(
      StatusCode::UNAUTHORIZED,
      "authentication_error",
      "missing_credentials",
      message,
      None,
    )
  }

  pub fn not_found(message: impl Into<String>) -> Self {
    Self::new(
      StatusCode::NOT_FOUND,
      "not_found",
      "not_found",
      message,
      None,
    )
  }

  pub fn conflict(message: impl Into<String>) -> Self {
    Self::new(StatusCode::CONFLICT, "conflict", "conflict", message, None)
  }

  pub fn internal_logged(source: &sqlx::Error) -> Self {
    tracing::error!(%source, "database error");
    Self::new(
      StatusCode::INTERNAL_SERVER_ERROR,
      "internal_error",
      "internal_error",
      "An internal error occurred",
      None,
    )
  }

  pub fn bad_gateway(message: impl Into<String>) -> Self {
    Self::new(
      StatusCode::BAD_GATEWAY,
      "bad_gateway",
      "bad_gateway",
      message,
      None,
    )
  }

  pub fn service_unavailable(message: impl Into<String>) -> Self {
    Self::new(
      StatusCode::SERVICE_UNAVAILABLE,
      "service_unavailable",
      "service_unavailable",
      message,
      None,
    )
  }

  pub fn too_many_requests(message: impl Into<String>) -> Self {
    Self::new(
      StatusCode::TOO_MANY_REQUESTS,
      "rate_limit_error",
      "too_many_requests",
      message,
      None,
    )
  }

  pub fn idempotency_mismatch() -> Self {
    Self::new(
      StatusCode::CONFLICT,
      "idempotency_error",
      "idempotency_key_mismatch",
      "Idempotency-Key was used with a different request payload",
      None,
    )
  }
}

impl IntoResponse for ApiError {
  fn into_response(self) -> Response {
    (self.status, Json(self.envelope)).into_response()
  }
}

pub fn bad_request(msg: &str) -> ApiError {
  ApiError::bad_request(msg)
}

pub fn not_found(msg: &str) -> ApiError {
  ApiError::not_found(msg)
}

pub fn internal(e: impl std::fmt::Display) -> ApiError {
  tracing::error!(display = %e, "internal error");
  ApiError::new(
    StatusCode::INTERNAL_SERVER_ERROR,
    "internal_error",
    "internal_error",
    "An internal error occurred",
    None,
  )
}

pub fn bad_gateway(msg: impl std::fmt::Display) -> ApiError {
  ApiError::bad_gateway(msg.to_string())
}

pub fn service_unavailable(msg: &str) -> ApiError {
  ApiError::service_unavailable(msg)
}

pub fn db_error(e: sqlx::Error) -> ApiError {
  ApiError::internal_logged(&e)
}

pub fn conflict(msg: &str) -> ApiError {
  ApiError::conflict(msg)
}

pub fn idempotency_mismatch() -> ApiError {
  ApiError::idempotency_mismatch()
}

pub fn too_many_requests(msg: impl Into<String>) -> ApiError {
  ApiError::too_many_requests(msg)
}
