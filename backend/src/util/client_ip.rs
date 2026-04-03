use std::net::{IpAddr, SocketAddr};

use axum::http::HeaderMap;
use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

/// Resolves client IP: `X-Client-IP` (Bun proxy), then optional `X-Forwarded-For` first hop when
/// `TRUST_FORWARDED_FOR=1`, then `ConnectInfo` socket.
pub fn resolve_client_ip(
  headers: &HeaderMap,
  connect: Option<SocketAddr>,
) -> Result<IpAddr, &'static str> {
  if let Some(raw) = headers.get("x-client-ip").and_then(|v| v.to_str().ok()) {
    let t = raw.trim();
    if t != "unknown" && !t.is_empty() {
      if let Ok(ip) = t.parse::<IpAddr>() {
        return Ok(ip);
      }
      return Err("Invalid X-Client-IP");
    }
  }

  if std::env::var("TRUST_FORWARDED_FOR")
    .map(|v| v == "1")
    .unwrap_or(false)
  {
    if let Some(raw) = headers.get("x-forwarded-for").and_then(|v| v.to_str().ok()) {
      let first = raw.split(',').next().map(str::trim).unwrap_or("");
      if !first.is_empty() {
        if let Ok(ip) = first.parse::<IpAddr>() {
          return Ok(ip);
        }
        return Err("Invalid X-Forwarded-For");
      }
    }
  }

  if let Some(addr) = connect {
    return Ok(addr.ip());
  }

  Err("Could not determine client address")
}

/// HMAC-SHA256(pepper, canonical IP); hex-encoded.
pub fn hash_client_ip(pepper: &str, ip: IpAddr) -> String {
  let mut mac = HmacSha256::new_from_slice(pepper.as_bytes()).expect("HMAC key length is valid");
  Mac::update(&mut mac, ip.to_string().as_bytes());
  hex::encode(mac.finalize().into_bytes())
}
