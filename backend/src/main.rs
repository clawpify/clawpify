use std::net::SocketAddr;

use axum::middleware::from_fn;
use backend::{db, middleware, routes};

#[tokio::main]
async fn main() {
  dotenvy::dotenv().ok();

  tracing_subscriber::fmt()
    .with_env_filter(
      tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| "backend=info,tower_http=info".into()),
    )
    .init();

  let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
  let pool = db::create_pool(&database_url)
    .await
    .expect("Failed to create DB pool");

  let app = routes::api_router(pool)
    .layer(from_fn(middleware::log_requests))
    .layer(middleware::cors_layer());

  let port: u16 = std::env::var("PORT")
    .ok()
    .and_then(|p| p.parse().ok())
    .unwrap_or(3000);

  let addr = SocketAddr::from(([0, 0, 0, 0], port));
  
  println!("Server is running on {}", addr);
  axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
    .await
    .unwrap();
}
