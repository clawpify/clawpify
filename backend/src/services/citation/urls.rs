pub fn validate_url(url: &str) -> Result<(), String> {
  let trusted: Option<Vec<String>> = std::env::var("TRUSTED_HOSTS")
    .ok()
    .and_then(|s| {
      let t = s.trim();
      if t.is_empty() {
        None
      } else {
        Some(
          t.split('|')
            .map(|x| x.trim())
            .filter(|x| !x.is_empty())
            .map(String::from)
            .collect(),
        )
      }
    });
  let refs: Option<Vec<&str>> =
    trusted.as_ref().map(|v| v.iter().map(String::as_str).collect());
  validate_url_with_trusted(url, refs.as_deref())
}

pub fn validate_url_with_trusted(
  url: &str,
  trusted_hosts: Option<&[&str]>,
) -> Result<(), String> {
  let normalized = normalize_url(url);
  let parsed = url::Url::parse(&normalized).map_err(|e| format!("Invalid URL: {}", e))?;

  if parsed.scheme() != "http" && parsed.scheme() != "https" {
    return Err("Only http and https URLs are allowed".to_string());
  }

  let host = parsed
    .host_str()
    .ok_or("URL must have a host")?
    .to_lowercase();

  if let Some(allowed) = trusted_hosts {
    if !allowed.is_empty()
      && !allowed.iter().any(|t| host_matches_trusted(&host, t))
    {
      return Err("URL host is not in TRUSTED_HOSTS".to_string());
    }
  }

  Ok(())
}

fn host_matches_trusted(host: &str, trusted: &str) -> bool {
  let trusted = trusted.trim().to_lowercase();
  host == trusted || host.ends_with(&format!(".{}", trusted))
}

pub fn normalize_url(url: &str) -> String {
  let url = url.trim();
  if url.starts_with("https://") {
    return url.to_string();
  }
  if url.starts_with("http://") {
    return url.replacen("http://", "https://", 1);
  }
  format!("https://{}", url)
}

pub fn normalize_domain(url: &str) -> String {
  let url = url.trim().to_lowercase();
  let url = url
    .trim_start_matches("https://")
    .trim_start_matches("http://");
  let url = url.trim_start_matches("www.");
  url.split('/').next().unwrap_or("").to_string()
}

pub(crate) fn normalize_for_match(s: &str) -> String {
  s.to_lowercase()
    .chars()
    .filter(|c| !c.is_whitespace())
    .collect()
}

#[cfg(test)]
mod tests {
  use super::{normalize_domain, normalize_url, validate_url_with_trusted};

  #[test]
  fn test_validate_url_when_trusted_hosts_unset() {
    assert!(validate_url_with_trusted("https://example.com", None).is_ok());
    assert!(validate_url_with_trusted("https://www.shopify.com", None).is_ok());
    assert!(validate_url_with_trusted("http://localhost", None).is_ok());
  }

  #[test]
  fn test_validate_url_when_trusted_hosts_set() {
    let trusted = ["myshopify.com", "shopify.com"];
    assert!(validate_url_with_trusted("https://store.myshopify.com", Some(&trusted)).is_ok());
    assert!(validate_url_with_trusted("https://www.shopify.com", Some(&trusted)).is_ok());
    assert!(validate_url_with_trusted("https://myshopify.com", Some(&trusted)).is_ok());
    assert!(validate_url_with_trusted("https://example.com", Some(&trusted)).is_err());
    assert!(validate_url_with_trusted("https://localhost", Some(&trusted)).is_err());
  }

  #[test]
  fn test_normalize_url_bare_domain() {
    assert_eq!(normalize_url("example.com"), "https://example.com");
  }

  #[test]
  fn test_normalize_url_http() {
    assert_eq!(normalize_url("http://example.com"), "https://example.com");
  }

  #[test]
  fn test_normalize_url_https_unchanged() {
    assert_eq!(normalize_url("https://example.com"), "https://example.com");
  }

  #[test]
  fn test_normalize_url_trimmed() {
    assert_eq!(normalize_url("  example.com  "), "https://example.com");
  }

  #[test]
  fn test_normalize_domain_full_url() {
    assert_eq!(normalize_domain("https://www.example.com/path"), "example.com");
  }

  #[test]
  fn test_normalize_domain_http() {
    assert_eq!(normalize_domain("http://example.com"), "example.com");
  }

  #[test]
  fn test_normalize_domain_www() {
    assert_eq!(normalize_domain("www.example.com"), "example.com");
  }
}
