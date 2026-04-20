use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct SubscriberRequest {
  pub email: String,                                  // email
}

#[derive(Serialize, ToSchema)]
pub struct SubscriberResponse {
  pub ok: bool,                                      // success flag
  #[serde(skip_serializing_if = "Option::is_none")]
  pub already_subscribed: Option<bool>,              // already subscribed flag
}
