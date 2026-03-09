//! LLM citation test cases for crawl and insight.
//! Tests that product/page data is correctly extracted for AI discoverability.
//! Uses alhwyn.com, atcyrus.com, and juniorscheesecake.com as real-world examples.

use backend::audit::crawl::{crawl_store, scrape_product_page, scrape_url_for_content};
use backend::audit::insight::score_product;
use backend::audit::models::StoreConfig;

const TEST_URLS: &[&str] = &[
    "https://alhwyn.com",
    "https://www.atcyrus.com/",
    "https://www.juniorscheesecake.com/",
];

/// Scraped page must have extractable title for LLM citation.
fn assert_llm_citation_ready(product: &backend::audit::models::ProductData) {
    assert!(!product.title.is_empty(), "Title required for LLM citation");
    assert_ne!(product.title, "Unknown", "Title should be extracted from page");
    assert!(
        product.title.len() >= 5,
        "Title too short for meaningful citation"
    );
}

#[tokio::test]
#[ignore = "requires network - run with: cargo test --test llm_citation_test -- --ignored"]
async fn test_scrape_alhwyn_com() {
    let product = scrape_product_page("https://alhwyn.com", None).await;
    let product = product.expect("Should scrape alhwyn.com");
    assert_llm_citation_ready(&product);
    assert!(
        product.url.as_ref().map(|u| u.contains("alhwyn")).unwrap_or(false),
        "URL should be preserved"
    );
}

#[tokio::test]
#[ignore = "requires network - run with: cargo test --test llm_citation_test -- --ignored"]
async fn test_scrape_atcyrus_com() {
    let product = scrape_product_page("https://www.atcyrus.com/", None).await;
    let product = product.expect("Should scrape atcyrus.com");
    assert_llm_citation_ready(&product);
    assert!(
        product.title.to_lowercase().contains("cyrus") || product.title.to_lowercase().contains("claude"),
        "Cyrus page should have relevant title"
    );
}

#[tokio::test]
#[ignore = "requires network - run with: cargo test --test llm_citation_test -- --ignored"]
async fn test_scrape_juniorscheesecake_com() {
    let product = scrape_product_page("https://www.juniorscheesecake.com/", None).await;
    let product = product.expect("Should scrape juniorscheesecake.com");
    assert_llm_citation_ready(&product);
    assert!(
        product.title.to_lowercase().contains("junior") || product.title.to_lowercase().contains("cheesecake"),
        "Junior's page should have relevant title"
    );
}

#[tokio::test]
#[ignore = "requires network - run with: cargo test --test llm_citation_test -- --ignored"]
async fn test_all_llm_citation_urls() {
    for url in TEST_URLS {
        let product = scrape_product_page(url, None).await;
        let product = product.expect(&format!("Should scrape {}", url));
        assert_llm_citation_ready(&product);
        let scores = score_product(&product);
        assert!(
            scores.data_quality >= 0 || scores.agent_friendliness >= 0,
            "Scores should be non-negative"
        );
    }
}

#[tokio::test]
#[ignore = "requires network - run with: cargo test --test llm_citation_test -- --ignored"]
async fn test_crawl_store_alhwyn_com() {
    let config = StoreConfig {
        base_url: "https://alhwyn.com".to_string(),
        platform: "url".to_string(),
    };
    let products = crawl_store(&config, None).await;
    for product in &products {
        assert_llm_citation_ready(product);
    }
}

#[tokio::test]
#[ignore = "requires network - run with: cargo test --test llm_citation_test -- --ignored"]
async fn test_scrape_url_for_content() {
    let content = scrape_url_for_content("https://alhwyn.com", None).await;
    let content = content.expect("Should scrape alhwyn.com for content");
    assert!(!content.is_empty(), "Content should be non-empty");
    assert!(
        content.to_lowercase().contains("alhwyn") || content.len() > 50,
        "Content should contain site info or be substantial"
    );
}

#[tokio::test]
#[ignore = "requires network - run with: cargo test --test llm_citation_test -- --ignored"]
async fn test_crawl_store_juniorscheesecake_com() {
    let config = StoreConfig {
        base_url: "https://www.juniorscheesecake.com".to_string(),
        platform: "url".to_string(),
    };
    let products = crawl_store(&config, None).await;
    assert!(!products.is_empty(), "Should discover product pages from Junior's");
    for product in &products {
        assert_llm_citation_ready(product);
        let scores = score_product(product);
        assert!(scores.data_quality >= 0);
        assert!(scores.agent_friendliness >= 0);
    }
}
