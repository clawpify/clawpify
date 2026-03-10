use super::models::{ProductData, ProductMeta, StoreConfig};
use once_cell::sync::Lazy;
use regex::Regex;
use std::time::Duration;

static LOC_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"<loc>([^<]+)</loc>").unwrap());
static TITLE_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"<title>([^<]*)</title>").unwrap());
static META_DESC_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r#"<meta\s+name="description"\s+content="([^"]*)""#).unwrap());
static OG_DESC_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r#"<meta\s+property="og:description"\s+content="([^"]*)""#).unwrap());
static BODY_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(?is)<body[^>]*>([\s\S]*?)</body>").unwrap());
static HTML_TAG_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"<[^>]+>").unwrap());
static WHITESPACE_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"\s+").unwrap());
static PRICE_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r#"\$[\d,]+(?:\.\d{2})?"#).unwrap());
static OG_TITLE_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r#"<meta property="og:title" content="([^"]*)""#).unwrap());
static OG_IMAGE_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r#"<meta property="og:image" content="([^"]*)""#).unwrap());
static META_DESC_CONTENT_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r#"<meta name="description" content="([^"]*)""#).unwrap());
static OG_DESC_CONTENT_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r#"<meta property="og:description" content="([^"]*)""#).unwrap());
static JSON_LD_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r#"<script type="application/ld\+json">([\s\S]*?)</script>"#).unwrap());

const FIRECRAWL_SCRAPE_API: &str = "https://api.firecrawl.dev/v2/scrape";
const FIRECRAWL_CRAWL_API: &str = "https://api.firecrawl.dev/v2/crawl";
const MAX_PRODUCTS: usize = 20;
const CRAWL_POLL_INTERVAL_MS: u64 = 2000;
const CRAWL_MAX_POLLS: u32 = 60;
const USER_AGENT: &str = "Clawpify-Audit/1.0";

fn http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .timeout(Duration::from_secs(15))
        .build()
        .expect("HTTP client")
}

async fn firecrawl_scrape(url: &str, api_key: &str) -> Option<serde_json::Value> {
    let res = http_client()
        .post(FIRECRAWL_SCRAPE_API)
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&serde_json::json!({
            "url": url,
            "formats": ["markdown", "metadata"]
        }))
        .send()
        .await
        .ok()?;

    if !res.status().is_success() {
        return None;
    }

    let body: serde_json::Value = res.json().await.ok()?;
    let success = body.get("success")?.as_bool()?;
    if !success {
        return None;
    }

    body.get("data").cloned()
}

/// Discovers product page URLs from the store sitemap.
pub async fn discover_product_urls(config: &StoreConfig) -> Vec<String> {
    let base = config.base_url.trim_end_matches('/');
    let url = if base.starts_with("http") {
        format!("{}/sitemap.xml", base)
    } else {
        format!("https://{}/sitemap.xml", base)
    };

    let res = http_client().get(&url).send().await.ok();
    let xml = match res {
        Some(r) if r.status().is_success() => r.text().await.ok(),
        _ => return vec![],
    };

    let xml = match xml {
        Some(x) => x,
        None => return vec![],
    };

    LOC_RE
        .captures_iter(&xml)
        .filter_map(|c| c.get(1).map(|m| m.as_str().to_string()))
        .filter(|u| u.contains("/product") || u.contains("/p/"))
        .take(MAX_PRODUCTS)
        .collect()
}

/// Scrapes a product page and returns structured ProductData.
/// Uses Firecrawl when api_key is set; otherwise falls back to HTTP fetch.
pub async fn scrape_product_page(
    url: &str,
    firecrawl_api_key: Option<&str>,
) -> Option<ProductData> {
    if let Some(api_key) = firecrawl_api_key {
        if let Some(product) = scrape_with_firecrawl(url, api_key).await {
            return Some(product);
        }
    }
    scrape_with_fetch(url).await
}

/// Scrapes a URL and returns markdown or extracted text content for gist generation.
/// Uses Firecrawl when api_key is set; otherwise falls back to HTTP fetch + basic HTML parsing.
pub async fn scrape_url_for_content(url: &str, api_key: Option<&str>) -> Option<String> {
    if let Some(key) = api_key {
        if let Some(markdown) = scrape_with_firecrawl_markdown(url, key).await {
            return Some(markdown);
        }
    }
    fetch_html_for_content(url).await
}

async fn scrape_with_firecrawl_markdown(url: &str, api_key: &str) -> Option<String> {
    let data = firecrawl_scrape(url, api_key).await?;
    data.get("markdown")
        .and_then(|m| m.as_str())
        .map(String::from)
}

async fn fetch_html_for_content(url: &str) -> Option<String> {
    let res = http_client().get(url).send().await.ok()?;
    let html = res.text().await.ok()?;
    Some(extract_text_from_html(&html))
}

fn extract_text_from_html(html: &str) -> String {
    let mut parts = Vec::new();

    if let Some(title) = TITLE_RE.captures(html).and_then(|c| c.get(1))
    {
        let t = title.as_str().trim();
        if !t.is_empty() {
            parts.push(t.to_string());
        }
    }

    if let Some(desc) = META_DESC_RE
        .captures(html)
        .or_else(|| OG_DESC_RE.captures(html))
        .and_then(|c| c.get(1))
    {
        let d = desc.as_str().trim();
        if !d.is_empty() {
            parts.push(d.to_string());
        }
    }

    if let Some(body) = BODY_RE.captures(html).and_then(|c| c.get(1))
    {
        let text = strip_html_tags(body.as_str());
        if !text.trim().is_empty() {
            parts.push(text);
        }
    }

    let combined = parts.join("\n\n");
    if combined.is_empty() {
        strip_html_tags(html)
    } else {
        combined
    }
}

fn strip_html_tags(html: &str) -> String {
    let text = HTML_TAG_RE.replace_all(html, " ");
    let text = WHITESPACE_RE.replace_all(&text, " ");
    text.trim().to_string()
}

fn product_from_firecrawl_metadata(
    meta: &serde_json::Value,
    markdown: Option<&str>,
    id: &str,
    source_url: &str,
) -> ProductData {
    let title = meta
        .get("ogTitle")
        .or(meta.get("title"))
        .and_then(|v| v.as_str())
        .unwrap_or("Unknown");
    let description = meta
        .get("ogDescription")
        .or(meta.get("description"))
        .and_then(|v| v.as_str())
        .map(String::from);
    let og_image = meta.get("ogImage").and_then(|v| v.as_str()).map(String::from);
    let price = markdown.and_then(|s| PRICE_RE.find(s).map(|m| m.as_str().to_string()));

    ProductData {
        id: id.to_string(),
        title: title.to_string(),
        description: description.clone(),
        price,
        url: Some(source_url.to_string()),
        meta: ProductMeta {
            title: meta.get("title").and_then(|v| v.as_str()).map(String::from),
            description: meta.get("description").and_then(|v| v.as_str()).map(String::from),
            og_title: Some(title.to_string()),
            og_description: description,
            og_image,
        },
        schema: None,
    }
}

async fn scrape_with_firecrawl(url: &str, api_key: &str) -> Option<ProductData> {
    let data = firecrawl_scrape(url, api_key).await?;
    let meta = data.get("metadata").or(Some(&serde_json::Value::Null));
    let meta = meta.as_ref().filter(|m| !m.is_null())?;
    let markdown = data.get("markdown").and_then(|m| m.as_str());
    let source_url = meta.get("sourceURL").and_then(|v| v.as_str()).unwrap_or(url);

    Some(product_from_firecrawl_metadata(meta, markdown, url, source_url))
}

async fn scrape_with_fetch(url: &str) -> Option<ProductData> {
    let res = http_client().get(url).send().await.ok()?;
    let html = res.text().await.ok()?;
    parse_html_to_product(&html, url)
}

fn parse_html_to_product(html: &str, url: &str) -> Option<ProductData> {
    let title = OG_TITLE_RE
        .captures(html)
        .and_then(|c| c.get(1).map(|m| m.as_str().to_string()))
        .or_else(|| {
            TITLE_RE
                .captures(html)
                .and_then(|c| c.get(1).map(|m| m.as_str().trim().to_string()))
        })
        .unwrap_or_else(|| "Unknown".to_string());

    let description = OG_DESC_CONTENT_RE
        .captures(html)
        .and_then(|c| c.get(1).map(|m| m.as_str().to_string()))
        .or_else(|| {
            META_DESC_CONTENT_RE
                .captures(html)
                .and_then(|c| c.get(1).map(|m| m.as_str().to_string()))
        });

    let og_image = OG_IMAGE_RE
        .captures(html)
        .and_then(|c| c.get(1).map(|m| m.as_str().to_string()));

    let price = PRICE_RE.find(html).map(|m| m.as_str().to_string());

    let schema = extract_json_ld_product(html);

    Some(ProductData {
        id: url.to_string(),
        title: title.clone(),
        description: description.clone(),
        price,
        url: Some(url.to_string()),
        meta: ProductMeta {
            title: Some(title.clone()),
            description: description.clone(),
            og_title: Some(title),
            og_description: description,
            og_image,
        },
        schema,
    })
}

fn extract_json_ld_product(html: &str) -> Option<serde_json::Value> {
    for cap in JSON_LD_RE.captures_iter(html) {
        let json_str = cap.get(1)?.as_str();
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(json_str) {
            let t = v.get("@type").and_then(|t| t.as_str());
            if t.map(|t| t.contains("Product")).unwrap_or(false) {
                return Some(v);
            }
            if let Some(arr) = v.as_array() {
                for item in arr {
                    if item
                        .get("@type")
                        .and_then(|t| t.as_str())
                        .map(|t| t.contains("Product"))
                        .unwrap_or(false)
                    {
                        return Some(item.clone());
                    }
                }
            }
        }
    }
    None
}

/// Crawls a store and returns product data for all discovered product pages.
pub async fn crawl_store(
    config: &StoreConfig,
    firecrawl_api_key: Option<String>,
) -> Vec<ProductData> {
    if let Some(ref api_key) = firecrawl_api_key {
        if let Some(products) = crawl_with_firecrawl(config, api_key).await {
            return products;
        }
    }
    crawl_with_scrape(config, firecrawl_api_key.as_deref()).await
}

async fn crawl_with_firecrawl(config: &StoreConfig, api_key: &str) -> Option<Vec<ProductData>> {
    let base_url = config.base_url.trim_end_matches('/');
    let crawl_url = if base_url.starts_with("http") {
        base_url.to_string()
    } else {
        format!("https://{}", base_url)
    };

    let client = http_client();
    let payload = serde_json::json!({
        "url": crawl_url,
        "limit": MAX_PRODUCTS,
        "sitemap": "include",
        "crawlEntireDomain": false,
        "includePaths": ["/products/.*", "/product/.*", "/p/.*"],
        "scrapeOptions": {
            "formats": ["markdown", "metadata"]
        }
    });

    let res = client
        .post(FIRECRAWL_CRAWL_API)
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&payload)
        .send()
        .await
        .ok()?;

    if !res.status().is_success() {
        return None;
    }

    let body: serde_json::Value = res.json().await.ok()?;
    let job_id = body.get("id")?.as_str()?;

    for _ in 0..CRAWL_MAX_POLLS {
        tokio::time::sleep(Duration::from_millis(CRAWL_POLL_INTERVAL_MS)).await;

        let status_res = client
            .get(format!("{}/{}", FIRECRAWL_CRAWL_API, job_id))
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .ok()?;

        if !status_res.status().is_success() {
            continue;
        }

        let status_body: serde_json::Value = status_res.json().await.ok()?;
        let status = status_body.get("status")?.as_str()?;

        if status == "completed" {
            let data = status_body.get("data")?.as_array()?;
            let products: Vec<ProductData> = data
                .iter()
                .filter_map(parse_firecrawl_page)
                .collect();
            return Some(products);
        }

        if status == "failed" {
            return None;
        }
    }

    None
}

fn parse_firecrawl_page(page: &serde_json::Value) -> Option<ProductData> {
    let data = page.get("data").unwrap_or(page);
    let meta = data.get("metadata").or(Some(&serde_json::Value::Null));
    let meta = meta.as_ref().filter(|m| !m.is_null())?;

    let source_url = meta.get("sourceURL").or(meta.get("url")).and_then(|v| v.as_str())?;
    let markdown = data.get("markdown").and_then(|m| m.as_str());

    Some(product_from_firecrawl_metadata(
        meta,
        markdown,
        source_url,
        source_url,
    ))
}

async fn crawl_with_scrape(
    config: &StoreConfig,
    firecrawl_api_key: Option<&str>,
) -> Vec<ProductData> {
    let urls = discover_product_urls(config).await;
    let mut results = Vec::with_capacity(urls.len());

    for url in urls {
        if let Some(product) = scrape_product_page(&url, firecrawl_api_key).await {
            results.push(product);
        }
        tokio::time::sleep(Duration::from_millis(600)).await;
    }

    results
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_html_to_product_og_tags() {
        let html = r#"
<!DOCTYPE html>
<html>
<head>
    <meta property="og:title" content="Cyrus | Your Claude Code powered Linear agent">
    <meta property="og:description" content="Ship 20x faster with Cyrus, your AI developer teammate.">
    <meta property="og:image" content="https://example.com/og.png">
</head>
<body></body>
</html>"#;
        let product = parse_html_to_product(html, "https://www.atcyrus.com/");
        let product = product.expect("Should parse");
        assert_eq!(product.title, "Cyrus | Your Claude Code powered Linear agent");
        assert!(product.description.as_ref().unwrap().contains("20x faster"));
        assert_eq!(product.url, Some("https://www.atcyrus.com/".to_string()));
    }

    #[test]
    fn test_parse_html_to_product_fallback_title() {
        let html = r#"<html><head><title>Junior's Cheesecake | The World's most fabulous Cheesecake</title></head><body></body></html>"#;
        let product = parse_html_to_product(html, "https://www.juniorscheesecake.com/");
        let product = product.expect("Should parse");
        assert!(product.title.contains("Junior") || product.title.contains("Cheesecake"));
    }

    #[test]
    fn test_extract_json_ld_product() {
        let html = r#"
<script type="application/ld+json">
{"@type":"Product","name":"Mini Ganache Cheesecake Heart","price":"51.95"}
</script>"#;
        let schema = extract_json_ld_product(html);
        let schema = schema.expect("Should extract");
        assert_eq!(schema.get("@type").and_then(|v| v.as_str()), Some("Product"));
        assert_eq!(schema.get("name").and_then(|v| v.as_str()), Some("Mini Ganache Cheesecake Heart"));
    }

    #[test]
    fn test_extract_json_ld_product_array() {
        let html = r#"
<script type="application/ld+json">
[{"@type":"Organization"},{"@type":"Product","name":"Test Product"}]
</script>"#;
        let schema = extract_json_ld_product(html);
        let schema = schema.expect("Should extract from array");
        assert_eq!(schema.get("@type").and_then(|v| v.as_str()), Some("Product"));
    }

    #[test]
    fn test_extract_text_from_html() {
        let html = r#"<!DOCTYPE html><html><head><title>Acme Corp</title>
<meta name="description" content="We sell widgets."></head>
<body><h1>Welcome</h1><p>Best widgets in town.</p></body></html>"#;
        let text = extract_text_from_html(html);
        assert!(text.contains("Acme Corp"));
        assert!(text.contains("We sell widgets"));
        assert!(text.contains("Welcome") || text.contains("widgets"));
    }
}
