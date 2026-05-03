use reqwest::StatusCode;

pub fn is_transient_ebay_error(status: StatusCode, body: &str) -> bool {
  matches!(
    status,
    StatusCode::BAD_GATEWAY | StatusCode::SERVICE_UNAVAILABLE | StatusCode::GATEWAY_TIMEOUT
  ) || is_edge_dns_failure(body)
}

pub fn is_edge_dns_failure(body: &str) -> bool {
  let lower = body.to_ascii_lowercase();
  lower.contains("dns failure")
    || lower.contains("errors.edgesuite.net")
    || lower.contains("service unavailable")
}

pub fn ebay_error_message(body: &str) -> Option<String> {
  let value: serde_json::Value = serde_json::from_str(body).ok()?;
  let errors = value.get("errors").and_then(|v| v.as_array())?;
  let first = errors.first()?;

  first
    .get("longMessage")
    .or_else(|| first.get("message"))
    .and_then(|v| v.as_str())
    .map(str::trim)
    .filter(|s| !s.is_empty())
    .map(str::to_string)
}

pub fn public_ebay_api_error(status: StatusCode, body: String) -> String {
  if is_transient_ebay_error(status, &body) {
    return "eBay is temporarily unavailable. Please retry in a minute.".to_string();
  }

  let message = ebay_error_message(&body).unwrap_or_else(|| {
    body
      .lines()
      .map(str::trim)
      .find(|line| !line.is_empty())
      .unwrap_or("eBay API request failed")
      .to_string()
  });

  format!("ebay api {status}: {message}")
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn detects_edgesuite_dns_failure() {
    assert!(is_edge_dns_failure(
      "Service Unavailable - DNS failure\nhttps://errors.edgesuite.net/11.test"
    ));
  }

  #[test]
  fn hides_transient_edgesuite_body() {
    let msg = public_ebay_api_error(
      StatusCode::SERVICE_UNAVAILABLE,
      "Service Unavailable - DNS failure\nReference #11".to_string(),
    );

    assert_eq!(
      msg,
      "eBay is temporarily unavailable. Please retry in a minute."
    );
  }

  #[test]
  fn parses_ebay_json_error_message() {
    let msg = ebay_error_message(
      r#"{"errors":[{"errorId":1,"message":"Short","longMessage":"Long message"}]}"#,
    );

    assert_eq!(msg.as_deref(), Some("Long message"));
  }
}
