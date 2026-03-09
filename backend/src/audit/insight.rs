use super::models::ProductData;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ProductScores {
    pub data_quality: i32,
    pub agent_friendliness: i32,
    pub issues: Vec<String>,
    pub recommendations: Vec<String>,
}

pub fn score_product(product: &ProductData) -> ProductScores {
    let mut issues = Vec::new();
    let mut recommendations = Vec::new();
    let mut data_quality = 100i32;

    if product.title.is_empty() || product.title.len() < 10 {
        issues.push("Title too short or missing".to_string());
        recommendations.push("Use a descriptive title (30–70 chars)".to_string());
        data_quality -= 25;
    } else if product.title.len() > 70 {
        issues.push("Title too long for search".to_string());
        data_quality -= 10;
    }

    if product
        .description
        .as_ref()
        .map(|d| d.len() < 50)
        .unwrap_or(true)
    {
        issues.push("Description missing or too brief".to_string());
        recommendations.push("Add a clear product description with specs".to_string());
        data_quality -= 25;
    }

    if product.meta.og_title.is_none() || product.meta.og_description.is_none() {
        issues.push("Open Graph tags incomplete".to_string());
        recommendations.push("Add og:title and og:description".to_string());
        data_quality -= 15;
    }

    if product.schema.is_none() {
        issues.push("No Schema.org Product".to_string());
        recommendations.push("Add JSON-LD Product schema".to_string());
        data_quality -= 15;
    }

    if product.price.is_none() {
        issues.push("Price not found".to_string());
        data_quality -= 10;
    }

    data_quality = data_quality.max(0);

    let mut agent_friendliness = data_quality;
    if product.title.len() < 20 && !product.title.is_empty() {
        issues.push("Title too vague for agent matching".to_string());
        agent_friendliness -= 10;
    }
    if product
        .description
        .as_ref()
        .map(|d| d.len() < 100)
        .unwrap_or(true)
    {
        issues.push("Description lacks detail for AI understanding".to_string());
        agent_friendliness -= 10;
    }
    agent_friendliness = agent_friendliness.max(0);

    ProductScores {
        data_quality,
        agent_friendliness,
        issues,
        recommendations,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::models::{ProductData, ProductMeta};

    fn make_product(
        title: &str,
        description: Option<&str>,
        price: Option<&str>,
        og_title: Option<&str>,
        og_description: Option<&str>,
        schema: bool,
    ) -> ProductData {
        ProductData {
            id: "https://example.com/product".to_string(),
            title: title.to_string(),
            description: description.map(String::from),
            price: price.map(String::from),
            url: Some("https://example.com/product".to_string()),
            meta: ProductMeta {
                title: Some(title.to_string()),
                description: description.map(String::from),
                og_title: og_title.map(String::from),
                og_description: og_description.map(String::from),
                og_image: None,
            },
            schema: if schema {
                Some(serde_json::json!({"@type": "Product"}))
            } else {
                None
            },
        }
    }

    #[test]
    fn test_score_product_ideal() {
        let product = make_product(
            "Wireless Bluetooth Headphones - Premium Sound",
            Some("High-quality wireless headphones with 30hr battery, noise cancellation, and premium drivers. Ideal for commuting and travel."),
            Some("99.99"),
            Some("Wireless Bluetooth Headphones"),
            Some("High-quality wireless headphones"),
            true,
        );
        let scores = score_product(&product);
        assert_eq!(scores.data_quality, 100);
        assert_eq!(scores.agent_friendliness, 100);
        assert!(scores.issues.is_empty());
    }

    #[test]
    fn test_score_product_poor_title() {
        let product = make_product("Hi", None, None, None, None, false);
        let scores = score_product(&product);
        assert!(scores.data_quality < 100);
        assert!(scores.issues.iter().any(|i| i.contains("Title")));
    }

    #[test]
    fn test_score_product_missing_description() {
        let product = make_product(
            "Good Product Title Here",
            Some("Short"),
            None,
            Some("Good Product"),
            Some("Short"),
            false,
        );
        let scores = score_product(&product);
        assert!(scores.data_quality < 100);
        assert!(scores.issues.iter().any(|i| i.contains("Description")));
    }

    #[test]
    fn test_score_product_no_schema() {
        let product = make_product(
            "Good Product Title Here",
            Some("A proper description that is long enough for the scoring logic to accept."),
            Some("49.99"),
            Some("Good Product"),
            Some("A proper description"),
            false,
        );
        let scores = score_product(&product);
        assert!(scores.issues.iter().any(|i| i.contains("Schema")));
    }
}
