mod twilio;

use axum::{routing::post, Router};

use super::state::AppState;

pub fn routes() -> Router<AppState> {
  Router::new().route(
    "/webhooks/twilio/messaging",
    post(twilio::twilio_messaging),
  )
}
