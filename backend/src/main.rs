use axum::{
    extract::Request,
    http::StatusCode,
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, put},
    Json, Router,
};
use serde::Serialize;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

#[derive(Serialize)]
struct ApiResponse {
    ok: bool,
    message: &'static str,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: &'static str,
}

async fn require_internal_auth(request: Request, next: Next) -> Response {
    let user_id = request
        .headers()
        .get("X-Internal-User-Id")
        .and_then(|v| v.to_str().ok());

    if user_id.is_none() {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ErrorResponse {
                error: "Missing internal auth header",
            }),
        )
            .into_response();
    }

    next.run(request).await
}

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let protected = Router::new()
        .route("/api/radar", get(|| async { Json(ApiResponse { ok: true, message: "radar" }) }))
        .route("/api/shield", put(|| async { Json(ApiResponse { ok: true, message: "shield" }) }))
        .route_layer(middleware::from_fn(require_internal_auth));

    let app = Router::new()
        .merge(protected)
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server is running on {}", addr);
    axum::serve(
        tokio::net::TcpListener::bind(addr).await.unwrap(),
        app,
    )
    .await
    .unwrap();
}