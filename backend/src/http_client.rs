use std::sync::OnceLock;
use std::time::Duration;

use reqwest::Client;

static CLIENT: OnceLock<Client> = OnceLock::new();

pub fn shared() -> &'static Client {
  CLIENT.get_or_init(|| {
    Client::builder()
      .connect_timeout(Duration::from_secs(10))
      .timeout(Duration::from_secs(120))
      .build()
      .expect("reqwest Client::builder")
  })
}