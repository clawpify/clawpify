use std::net::SocketAddr;
use std::path::Path;

use axum::middleware::from_fn;
use backend::{db, middleware, routes};

/// Loads env files so S3 vars work even when the shell cwd is the monorepo root.
/// `dotenvy::dotenv()` only searches upward from cwd — it never opens `backend/.env` by itself.
fn load_dotenv() {
  let crate_root = Path::new(env!("CARGO_MANIFEST_DIR"));
  let _ = dotenvy::from_path(crate_root.join(".env"));
  if let Some(repo) = crate_root.parent() {
    let _ = dotenvy::from_path(repo.join(".env"));
  }
  let _ = dotenvy::dotenv();
}

#[tokio::main]
async fn main() {
  load_dotenv();

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
    .layer(from_fn(middleware::request_id))
    .layer(middleware::cors_layer());

  let port: u16 = std::env::var("PORT")
    .ok()
    .and_then(|p| p.parse().ok())
    .unwrap_or(3000);

  let addr = SocketAddr::from(([0, 0, 0, 0], port));
  
  println!("Server is running on {}", addr);
  let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
  axum::serve(
    listener,
    app.into_make_service_with_connect_info::<SocketAddr>(),
  )
  .await
  .unwrap();
}
