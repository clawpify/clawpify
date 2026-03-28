//! Phone number parsing helpers.

/// Normalize and validate E.164: `+` then 8–15 digits; first digit after `+` is country code (1–9).
/// Strips spaces, tabs, hyphens, and parentheses before validation.
pub fn parse_e164(raw: &str) -> Result<String, &'static str> {
  let collapsed: String = raw
    .chars()
    .filter(|c| !matches!(c, ' ' | '\t' | '-' | '(' | ')'))
    .collect();
  let s = collapsed.trim();
  if !s.starts_with('+') {
    return Err("phone must be in E.164 format (start with +)");
  }
  let digits = &s[1..];
  if digits.len() < 8 || digits.len() > 15 {
    return Err("phone must have 8–15 digits after +");
  }
  if !digits.chars().all(|c| c.is_ascii_digit()) {
    return Err("only digits may appear after +");
  }
  let first = digits
    .chars()
    .next()
    .expect("len checked");
  if !('1'..='9').contains(&first) {
    return Err("country code must not start with 0");
  }
  Ok(s.to_string())
}

#[cfg(test)]
mod tests {
  use super::parse_e164;

  #[test]
  fn accepts_trimmed_e164() {
    assert_eq!(parse_e164("+15551234567").unwrap(), "+15551234567");
  }

  #[test]
  fn strips_formatting_chars() {
    assert_eq!(
      parse_e164("+1 (555) 123-4567").unwrap(),
      "+15551234567"
    );
  }

  #[test]
  fn rejects_without_plus() {
    assert!(parse_e164("15551234567").is_err());
  }

  #[test]
  fn rejects_too_short() {
    assert!(parse_e164("+1234567").is_err());
  }
}
