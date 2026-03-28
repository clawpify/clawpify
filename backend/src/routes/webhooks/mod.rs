mod twilio;

use axum::{routing::post, Router};

pub fn routes() -> Router {
  Router::new().route(
    "/webhooks/twilio/messaging",
    post(twilio::twilio_messaging),
  )
}
