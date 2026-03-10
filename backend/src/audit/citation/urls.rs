use std::net::IpAddr;

/// Validates that a URL is safe for server-side fetching (SSRF protection).
/// Rejects localhost, private IPs, link-local, and cloud metadata endpoints.
pub fn validate_url_for_scrape(url: &str) -> Result<(), String> {
    let normalized = normalize_url_for_scrape(url);
    let parsed = url::Url::parse(&normalized).map_err(|e| format!("Invalid URL: {}", e))?;

    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return Err("Only http and https URLs are allowed".to_string());
    }

    let host = parsed
        .host_str()
        .ok_or("URL must have a host")?
        .to_lowercase();

    // Blocked hostnames
    if matches!(
        host.as_str(),
        "localhost"
            | "localhost."
            | "metadata"
            | "metadata."
            | "metadata.google.internal"
            | "metadata.google.internal."
    ) {
        return Err("URL host is not allowed".to_string());
    }
    if host.ends_with(".google.internal") || host.ends_with(".local") {
        return Err("URL host is not allowed".to_string());
    }

    // Resolve host to IP for private range check (IPv4 only for common cases)
    if let Ok(ip) = host.parse::<IpAddr>() {
        if is_private_or_internal_ip(ip) {
            return Err("URL must not target private or internal IP addresses".to_string());
        }
    }

    Ok(())
}

fn is_private_or_internal_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            let octets = v4.octets();
            // 127.0.0.0/8 (loopback)
            if octets[0] == 127 {
                return true;
            }
            // 0.0.0.0/8
            if octets[0] == 0 {
                return true;
            }
            // 10.0.0.0/8
            if octets[0] == 10 {
                return true;
            }
            // 169.254.0.0/16 (link-local)
            if octets[0] == 169 && octets[1] == 254 {
                return true;
            }
            // 172.16.0.0/12
            if octets[0] == 172 && (16..=31).contains(&octets[1]) {
                return true;
            }
            // 192.168.0.0/16
            if octets[0] == 192 && octets[1] == 168 {
                return true;
            }
            false
        }
        IpAddr::V6(v6) => {
            let segs = v6.segments();
            // ::1 (loopback)
            if segs == [0, 0, 0, 0, 0, 0, 0, 1] {
                return true;
            }
            // fc00::/7 (unique local)
            if (segs[0] & 0xfe00) == 0xfc00 {
                return true;
            }
            // fe80::/10 (link-local)
            if (segs[0] & 0xffc0) == 0xfe80 {
                return true;
            }
            false
        }
    }
}

/// Normalizes a URL for scraping: ensures it has https:// scheme.
pub fn normalize_url_for_scrape(url: &str) -> String {
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
    let url = url.trim_start_matches("https://").trim_start_matches("http://");
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
    use super::{normalize_domain, normalize_url_for_scrape, validate_url_for_scrape};

    #[test]
    fn test_validate_url_allows_public() {
        assert!(validate_url_for_scrape("https://example.com").is_ok());
        assert!(validate_url_for_scrape("https://www.shopify.com").is_ok());
    }

    #[test]
    fn test_validate_url_rejects_localhost() {
        assert!(validate_url_for_scrape("http://localhost").is_err());
        assert!(validate_url_for_scrape("https://localhost/path").is_err());
    }

    #[test]
    fn test_validate_url_rejects_private_ips() {
        assert!(validate_url_for_scrape("http://127.0.0.1").is_err());
        assert!(validate_url_for_scrape("http://192.168.1.1").is_err());
        assert!(validate_url_for_scrape("http://10.0.0.1").is_err());
        assert!(validate_url_for_scrape("http://169.254.169.254").is_err());
        assert!(validate_url_for_scrape("http://172.16.0.1").is_err());
    }

    #[test]
    fn test_validate_url_rejects_metadata() {
        assert!(validate_url_for_scrape("http://metadata.google.internal").is_err());
    }

    #[test]
    fn test_normalize_url_for_scrape_bare_domain() {
        assert_eq!(normalize_url_for_scrape("example.com"), "https://example.com");
    }

    #[test]
    fn test_normalize_url_for_scrape_http() {
        assert_eq!(
            normalize_url_for_scrape("http://example.com"),
            "https://example.com"
        );
    }

    #[test]
    fn test_normalize_url_for_scrape_https_unchanged() {
        assert_eq!(
            normalize_url_for_scrape("https://example.com"),
            "https://example.com"
        );
    }

    #[test]
    fn test_normalize_url_for_scrape_trimmed() {
        assert_eq!(
            normalize_url_for_scrape("  example.com  "),
            "https://example.com"
        );
    }

    #[test]
    fn test_normalize_domain_full_url() {
        assert_eq!(
            normalize_domain("https://www.example.com/path"),
            "example.com"
        );
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
