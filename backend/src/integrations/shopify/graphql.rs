use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE};
use serde_json::{json, Value};

use crate::http_client;

fn api_version() -> String {
  std::env::var("SHOPIFY_API_VERSION").unwrap_or_else(|_| "2025-01".to_string())
}

fn graphql_url(shop_domain: &str, api_version: &str) -> String {
  format!(
    "https://{shop_domain}/admin/api/{api_version}/graphql.json"
  )
}

fn endpoint(shop_domain: &str) -> String {
  graphql_url(shop_domain, &api_version())
}

pub async fn admin_graphql(
  shop_domain: &str,
  access_token: &str,
  query: &str,
  variables: Value,
) -> Result<Value, String> {
  let client = http_client::shared();
  let mut headers = HeaderMap::new();
  headers.insert(
    "X-Shopify-Access-Token",
    HeaderValue::from_str(access_token).map_err(|e| e.to_string())?,
  );
  headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

  let body = json!({ "query": query, "variables": variables });

  let res = client
    .post(endpoint(shop_domain))
    .headers(headers)
    .json(&body)
    .send()
    .await
    .map_err(|e| e.to_string())?;
  
  let status = res.status();
  let v: Value = res.json().await.map_err(|e| e.to_string())?;

  if let Some(errs) = v.get("errors") {
    if !errs.as_array().map(|a| a.is_empty()).unwrap_or(true) {
      return Err(format!("graphql errors: {errs}"));
    }
  }

  if !status.is_success() {
    return Err(format!("http {status}: {v}"));
  }

  Ok(v)
}

fn data(v: &Value) -> Result<&Value, String> {
  v.get("data").ok_or_else(|| "missing data".to_string())
}

fn user_errors(path: &[&str], data: &Value) -> Option<String> {
  let mut cur = data;
  for p in path {
    cur = cur.get(*p)?;
  }
  let arr = cur.get("userErrors")?.as_array()?;
  if arr.is_empty() {
    return None;
  }
  Some(
    arr
    .iter()
    .filter_map(|e| e.get("message").and_then(|m| m.as_str()))
    .collect::<Vec<_>>()
    .join("; "),
  )
}

const LIST_PRODUCTS: &str = r#"
query ListProducts($first: Int!, $after: String, $query: String) {
  products(first: $first, after: $after, query: $query) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      title
      status
      vendor
      productType
      tags
      updatedAt
    }
  }
}
"#;

pub async fn list_products(
  shop_domain: &str,
  token: &str,
  first: i64,
  after: Option<&str>,
  search_query: Option<&str>, // e.g. "status:DRAFT"
) -> Result<Value, String> {
  let variables = json!({
    "first": first,
    "after": after,
    "query": search_query,
  });
  admin_graphql(shop_domain, token, LIST_PRODUCTS, variables).await
}

// --- Product: get (+ metafields) ---
const GET_PRODUCT: &str = r#"
query GetProduct($id: ID!) {
  product(id: $id) {
    id
    title
    descriptionHtml
    status
    vendor
    productType
    tags
    variants(first: 50) {
      nodes { id title sku price compareAtPrice }
    }
    metafields(first: 50) {
      nodes { id namespace key type value }
    }
  }
}
"#;

pub async fn get_product(shop_domain: &str, token: &str, product_gid: &str) -> Result<Value, String> {
  let variables = json!({ "id": product_gid });
  admin_graphql(shop_domain, token, GET_PRODUCT, variables).await
}

// --- Product: create (default DRAFT for safe reseller flow) ---
const PRODUCT_CREATE: &str = r#"
mutation CreateProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
  productCreate(product: $product, media: $media) {
    product { id title status }
    userErrors { field message }
  }
}
"#;

#[allow(clippy::too_many_arguments)]
pub async fn create_product_draft(
  shop_domain: &str,
  token: &str,
  title: &str,
  description_html: &str,
  vendor: &str,
  product_type: &str,
  tags: &[String],
  media: Option<Value>, // e.g. json!([{ "originalSource": "https://...", "mediaContentType": "IMAGE" }])
) -> Result<String, String> {
  let product = json!({
    "title": title,
    "descriptionHtml": description_html,
    "vendor": vendor,
    "productType": product_type,
    "tags": tags,
    "status": "DRAFT",
  });
  let variables = if let Some(m) = media {
    json!({ "product": product, "media": m })
  } else {
    json!({ "product": product, "media": null })
  };
  let v = admin_graphql(shop_domain, token, PRODUCT_CREATE, variables).await?;
  let d = data(&v)?;
  if let Some(msg) = user_errors(&["productCreate"], d) {
    return Err(msg);
  }
  let gid = d["productCreate"]["product"]["id"]
    .as_str()
    .ok_or_else(|| "missing product id".to_string())?;
  Ok(gid.to_string())
}

const PRODUCT_UPDATE: &str = r#"
mutation UpdateProduct($product: ProductUpdateInput!) {
  productUpdate(product: $product) {
    product { id title status }
    userErrors { field message }
  }
}
"#;

pub async fn update_product(
  shop_domain: &str,
  token: &str,
  product_gid: &str,
  patch: Value, // merge fields: title, descriptionHtml, tags, vendor, productType, status
) -> Result<(), String> {
  let mut product = patch;
  if product.get("id").is_none() {
    product["id"] = json!(product_gid);
  }
  let variables = json!({ "product": product });
  let v = admin_graphql(shop_domain, token, PRODUCT_UPDATE, variables).await?;
  let d = data(&v)?;
  if let Some(msg) = user_errors(&["productUpdate"], d) {
    return Err(msg);
  }
  Ok(())
}

const VARIANTS_BULK_UPDATE: &str = r#"
mutation BulkUpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id price compareAtPrice }
    userErrors { field message }
  }
}
"#;

pub async fn update_variant_prices(
  shop_domain: &str,
  token: &str,
  product_gid: &str,
  updates: Value, // array of { "id": "gid://...Variant/...", "price": "12.99", "compareAtPrice": "19.99" }
) -> Result<(), String> {
  let variables = json!({
    "productId": product_gid,
    "variants": updates,
  });
  let v = admin_graphql(shop_domain, token, VARIANTS_BULK_UPDATE, variables).await?;
  let d = data(&v)?;
  if let Some(msg) = user_errors(&["productVariantsBulkUpdate"], d) {
    return Err(msg);
  }
  Ok(())
}

// --- Metafields: set (create or update by owner + namespace/key) ---
const METAFIELDS_SET: &str = r#"
mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { id namespace key type value }
    userErrors { field message }
  }
}
"#;

/// Common types: "single_line_text_field", "multi_line_text_field", "number_integer", "json", ...
pub async fn metafields_set(
  shop_domain: &str,
  token: &str,
  metafields: Value, // [{ ownerId, namespace, key, type, value }, ...]
) -> Result<(), String> {
  let variables = json!({ "metafields": metafields });
  let v = admin_graphql(shop_domain, token, METAFIELDS_SET, variables).await?;
  let d = data(&v)?;
  if let Some(msg) = user_errors(&["metafieldsSet"], d) {
    return Err(msg);
  }
  Ok(())
}

const STAGED_UPLOADS_CREATE: &str = r#"
mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets {
      url
      resourceUrl
      parameters { name value }
    }
    userErrors { field message }
  }
}
"#;

pub async fn staged_uploads_create(
  shop_domain: &str,
  token: &str,
  input: Value,
) -> Result<Value, String> {
  let v = admin_graphql(
    shop_domain,
    token,
    STAGED_UPLOADS_CREATE,
    json!({ "input": input }),
  )
  .await?;
  let d = data(&v)?;
  if let Some(msg) = user_errors(&["stagedUploadsCreate"], d) {
    return Err(msg);
  }
  Ok(v)
}

pub async fn fetch_url_bytes(url: &str) -> Result<Vec<u8>, String> {
  let client = http_client::shared();
  let res = client.get(url).send().await.map_err(|e| e.to_string())?;
  if !res.status().is_success() {
    return Err(format!("fetch image {}", res.status()));
  }
  res.bytes().await.map(|b| b.to_vec()).map_err(|e| e.to_string())
}

/// POST multipart to Shopify staged target URL (`parameters` + `file` part).
pub async fn upload_staged_multipart(
  upload_url: &str,
  parameters: &[(String, String)],
  file_bytes: Vec<u8>,
  filename: &str,
  mime: &str,
) -> Result<(), String> {
  let client = http_client::shared();
  let mut form = reqwest::multipart::Form::new();
  for (k, v) in parameters {
    form = form.text(k.clone(), v.clone());
  }
  let part = reqwest::multipart::Part::bytes(file_bytes)
    .file_name(filename.to_string())
    .mime_str(mime)
    .map_err(|e| e.to_string())?;
  form = form.part("file", part);
  let res = client
    .post(upload_url)
    .multipart(form)
    .send()
    .await
    .map_err(|e| e.to_string())?;
  if !res.status().is_success() {
    let body = res.text().await.unwrap_or_default();
    return Err(format!("staged upload failed: {body}"));
  }
  Ok(())
}
