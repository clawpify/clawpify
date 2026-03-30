use sqlx::PgPool;

/// Shared application state for Axum handlers ([`State`](axum::extract::State)).
#[derive(Clone)]
pub struct AppState {
  pub pool: PgPool,
}

impl AppState {
  pub fn new(pool: PgPool) -> Self {
    Self { pool }
  }
}
