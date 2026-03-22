#[derive(Debug, Clone, Copy)]
pub struct Pagination {
  /* limit of the pagination */
  pub limit: i64,
  /* offset of the pagination */
  pub offset: i64,
}

impl Pagination {
  pub fn new(limit: Option<i64>, offset: Option<i64>) -> Self {
    let limit = limit.unwrap_or(50).clamp(1, 100);
    let offset = offset.unwrap_or(0).max(0);

    Self { limit, offset }
  }
}