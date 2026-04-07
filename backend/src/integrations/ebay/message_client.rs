use super::config::EbayConfig;

pub struct EbayMessageClient<'a> {
  pub cfg: &'a EbayConfig,
  pub access_token: &'a str,
}

impl<'a> EbayMessageClient<'a> {
  pub async fn get_conversations(&self, query: &str) -> Result<String, reqwest::Error> {
    let base = self.cfg.api_base_url().trim_end_matches('/');
    let url = format!("{}/commerce/message/v1/conversation?{}", base, query);
    crate::http_client::shared()
      .get(url)
      .header("Authorization", format!("Bearer {}", self.access_token))
      .send()
      .await?
      .text()
      .await
  }
  // get_conversation(id), post send_message — same pattern
}