use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct SubscriberRequest {
  pub email: String,
}

#[derive(Serialize)]
pub struct SubscriberResponse {
  pub ok: bool,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub already_subscribed: Option<bool>,
}
