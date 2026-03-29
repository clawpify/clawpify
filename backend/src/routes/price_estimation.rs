use axum::{
    extract::Multipart,
    middleware,
    routing::post,
    Json, Router,
};
use base64::Engine;

use crate::dto::price_estimation::PriceEstimationResponse;
use crate::error::{self, ApiError};
use crate::middleware as mw;
use crate::services::price_estimation;

const MAX_IMAGE_SIZE: usize = 20 * 1024 * 1024; // 20 MB per image
const MAX_IMAGES: usize = 10;
const DEFAULT_LIMIT: u32 = 10;

pub fn routes() -> Router<()> {
    Router::new()
        .route("/price-estimation", post(handle_price_estimation))
        .route_layer(middleware::from_fn(mw::require_internal_auth))
}

async fn handle_price_estimation(
    mut multipart: Multipart,
) -> Result<Json<PriceEstimationResponse>, ApiError> {
    let mut images_base64: Vec<String> = Vec::new();
    let mut description: Option<String> = None;
    let mut limit: u32 = DEFAULT_LIMIT;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| error::bad_request(&format!("multipart read error: {e}")))?
    {
        let name = field.name().unwrap_or("").to_string();

        match name.as_str() {
            "images" | "image" => {
                if images_base64.len() >= MAX_IMAGES {
                    return Err(error::bad_request(&format!(
                        "at most {MAX_IMAGES} images allowed"
                    )));
                }
                let content_type = field
                    .content_type()
                    .unwrap_or("image/jpeg")
                    .to_string();

                let bytes = field
                    .bytes()
                    .await
                    .map_err(|e| error::bad_request(&format!("failed to read image: {e}")))?;

                if bytes.len() > MAX_IMAGE_SIZE {
                    return Err(error::bad_request(&format!(
                        "image exceeds {MAX_IMAGE_SIZE} byte limit"
                    )));
                }

                let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                images_base64.push(format!("data:{content_type};base64,{b64}"));
            }
            "description" => {
                let text = field
                    .text()
                    .await
                    .map_err(|e| error::bad_request(&format!("failed to read description: {e}")))?;
                if !text.is_empty() {
                    description = Some(text);
                }
            }
            "limit" => {
                let text = field
                    .text()
                    .await
                    .map_err(|e| error::bad_request(&format!("failed to read limit: {e}")))?;
                if let Ok(n) = text.parse::<u32>() {
                    limit = n.min(50).max(1);
                }
            }
            _ => {
                // Skip unknown fields
            }
        }
    }

    if images_base64.is_empty() {
        return Err(error::bad_request(
            "at least one image is required (field name: 'image' or 'images')",
        ));
    }

    let result = price_estimation::estimate(images_base64, description, limit)
        .await
        .map_err(|e| error::bad_gateway(e))?;

    Ok(Json(result))
}
