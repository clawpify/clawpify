use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct SubscriberRequest {
  pub email: String,
}

#[derive(Serialize)]
pub struct SubscriberResponse {
  /* success flag */
  pub ok: bool,
  /* already subscribed flag */
  #[serde(skip_serializing_if = "Option::is_none")]
  pub already_subscribed: Option<bool>,
}
