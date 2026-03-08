use axum::{
    routing::{get, put},
    Json, Router,
};
use serde::Serialize;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

#[derive(Serialize)]
struct ApiResponse {
    ok:bool,
    message: &'static str,
}

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
      .allow_origin(Any) 
      .allow_methods(Any) 
      .allow_headers(Any);
    
    let app = Router::new()
      .route("/api/radar", get(|| async { Json(ApiResponse { ok: true, message: "radar" }) }))
      .route("/api/shield", put(|| async { Json(ApiResponse { ok: true, message: "shield" }) }))
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