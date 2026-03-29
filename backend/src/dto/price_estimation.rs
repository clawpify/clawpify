use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct PriceEstimationResponse {
    pub attributes: ProductAttributes,
    pub comps: Vec<Comp>,
    pub price_range: PriceRange,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductAttributes {
    pub title: String,
    pub category: String,
    pub brand: Option<String>,
    pub condition: Option<String>,
    pub color: Option<String>,
    pub keywords: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct Comp {
    pub title: String,
    pub price: f64,
    pub currency: String,
    pub condition: Option<String>,
    pub source: String,
    pub url: String,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PriceRange {
    pub low: f64,
    pub mid: f64,
    pub high: f64,
    pub currency: String,
    pub comp_count: usize,
}
