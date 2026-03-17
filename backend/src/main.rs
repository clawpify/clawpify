use std::net::SocketAddr;

use backend::{db, middleware, routes};

#[tokio::main]
async fn main() {
  dotenvy::dotenv().ok();

  let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
  let pool = db::create_pool(&database_url)
    .await
    .expect("Failed to create DB pool");

  let rate_limit_pool = if let Ok(url) = std::env::var("RATE_LIMIT_DATABASE_URL") {
    Some(
      db::create_rate_limit_pool(&url)
        .await
        .expect("Failed to create rate limit DB pool"),
    )
  } else {
    None
  };

  let app = routes::api_router(pool, rate_limit_pool).layer(middleware::cors_layer());

  let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
  println!("Server is running on {}", addr);
  axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
    .await
    .unwrap();
}
