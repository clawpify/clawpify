use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct SubscriberRequest {
  pub email: String,
}

#[derive(Serialize, ToSchema)]
pub struct SubscriberResponse {
  /* success flag */
  pub ok: bool,
  /* already subscribed flag */
  #[serde(skip_serializing_if = "Option::is_none")]
  pub already_subscribed: Option<bool>,
}
