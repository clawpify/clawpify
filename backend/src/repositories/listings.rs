use sqlx::{PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use crate::dto::listings::{CreateListingRequest, UpdateListingRequest};
use crate::models::consignment_listing::ConsignmentListing;
use super::pagination::Pagination;

pub async fn list_by_org(
  pool: &PgPool,
  org_id: &str,
  status: Option<&str>,
  page: Pagination,
) -> Result<Vec<ConsignmentListing>, sqlx::Error> {
  let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(
    r#"SELECT id, org_id, created_by_user_id, status, title, description_html, product_type, vendor,
              tags, price_cents, currency_code, sku, media_urls, ai_quality, ai_attributes,
              suggested_price_cents, created_at, updated_at
       FROM consignment_listings
       WHERE org_id ="#,
  );
  qb.push_bind(org_id);
  if let Some(s) = status {
    qb.push(" AND status = ");
    qb.push_bind(s);
  }
  qb.push(" ORDER BY created_at DESC LIMIT ");
  qb.push_bind(page.limit);
  qb.push(" OFFSET ");
  qb.push_bind(page.offset);
  qb.build_query_as::<ConsignmentListing>().fetch_all(pool).await
}

pub async fn get_by_id(
  pool: &PgPool,
  org_id: &str,
  id: Uuid,
) -> Result<Option<ConsignmentListing>, sqlx::Error> {
  sqlx::query_as::<_, ConsignmentListing>(
    r#"SELECT id, org_id, created_by_user_id, status, title, description_html, product_type, vendor,
              tags, price_cents, currency_code, sku, media_urls, ai_quality, ai_attributes,
              suggested_price_cents, created_at, updated_at
       FROM consignment_listings
       WHERE id = $1 AND org_id = $2"#,
  )
  .bind(id)
  .bind(org_id)
  .fetch_optional(pool)
  .await
}

pub async fn create(
  pool: &PgPool,
  org_id: &str,
  created_by_user_id: Option<&str>,
  body: CreateListingRequest,
) -> Result<ConsignmentListing, sqlx::Error> {
  let title = body
    .title
    .filter(|t| !t.trim().is_empty())
    .unwrap_or_else(|| "Untitled draft".to_string());
  let description_html = body.description_html.unwrap_or_default();
  let product_type = body.product_type.unwrap_or_default();
  let vendor = body.vendor.unwrap_or_default();
  let tags = body.tags.unwrap_or_default();
  let price_cents = body.price_cents.unwrap_or(0).max(0);
  let currency_code = body
    .currency_code
    .unwrap_or_else(|| "USD".to_string());
  let sku = body.sku.unwrap_or_default();
  let media_urls = body
    .media_urls
    .unwrap_or_else(|| serde_json::json!([]));
  let status = body
    .status
    .unwrap_or_else(|| "draft".to_string());

  sqlx::query_as::<_, ConsignmentListing>(
    r#"INSERT INTO consignment_listings (
         org_id, created_by_user_id, status, title, description_html, product_type, vendor, tags,
         price_cents, currency_code, sku, media_urls, ai_quality, ai_attributes, suggested_price_cents
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id, org_id, created_by_user_id, status, title, description_html, product_type, vendor,
                 tags, price_cents, currency_code, sku, media_urls, ai_quality, ai_attributes,
                 suggested_price_cents, created_at, updated_at"#,
  )
  .bind(org_id)
  .bind(created_by_user_id)
  .bind(&status)
  .bind(&title)
  .bind(&description_html)
  .bind(&product_type)
  .bind(&vendor)
  .bind(&tags)
  .bind(price_cents)
  .bind(&currency_code)
  .bind(&sku)
  .bind(&media_urls)
  .bind(&body.ai_quality)
  .bind(&body.ai_attributes)
  .bind(body.suggested_price_cents)
  .fetch_one(pool)
  .await
}

pub async fn update(
  pool: &PgPool,
  org_id: &str,
  id: Uuid,
  patch: UpdateListingRequest,
) -> Result<Option<ConsignmentListing>, sqlx::Error> {
  let row = sqlx::query_as::<_, ConsignmentListing>(
    r#"UPDATE consignment_listings SET
         title = COALESCE($3, title),
         description_html = COALESCE($4, description_html),
         product_type = COALESCE($5, product_type),
         vendor = COALESCE($6, vendor),
         tags = COALESCE($7, tags),
         price_cents = COALESCE($8, price_cents),
         currency_code = COALESCE($9, currency_code),
         sku = COALESCE($10, sku),
         media_urls = COALESCE($11, media_urls),
         status = COALESCE($12, status),
         ai_quality = COALESCE($13, ai_quality),
         ai_attributes = COALESCE($14, ai_attributes),
         suggested_price_cents = COALESCE($15, suggested_price_cents),
         updated_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING id, org_id, created_by_user_id, status, title, description_html, product_type, vendor,
                 tags, price_cents, currency_code, sku, media_urls, ai_quality, ai_attributes,
                 suggested_price_cents, created_at, updated_at"#,
  )
  .bind(id)
  .bind(org_id)
  .bind(patch.title)
  .bind(patch.description_html)
  .bind(patch.product_type)
  .bind(patch.vendor)
  .bind(patch.tags)
  .bind(patch.price_cents)
  .bind(patch.currency_code)
  .bind(patch.sku)
  .bind(patch.media_urls)
  .bind(patch.status)
  .bind(patch.ai_quality)
  .bind(patch.ai_attributes)
  .bind(patch.suggested_price_cents)
  .fetch_optional(pool)
  .await?;

  Ok(row)
}

pub async fn delete(pool: &PgPool, org_id: &str, id: Uuid) -> Result<bool, sqlx::Error> {
  let done = sqlx::query(r#"DELETE FROM consignment_listings WHERE id = $1 AND org_id = $2"#)
    .bind(id)
    .bind(org_id)
    .execute(pool)
    .await?;
  Ok(done.rows_affected() > 0)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::dto::listings::CreateListingRequest;

  async fn ensure_org(pool: &PgPool, id: &str) {
    sqlx::query("INSERT INTO organizations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING")
      .bind(id)
      .execute(pool)
      .await
      .unwrap();
  }

  #[sqlx::test(migrations = "../migrations")]
  async fn create_list_draft(pool: PgPool) {
    ensure_org(&pool, "org-list-1").await;
    let row = create(
      &pool,
      "org-list-1",
      Some("u1"),
      CreateListingRequest {
        title: Some("Jacket".to_string()),
        description_html: Some("<p>Nice</p>".to_string()),
        product_type: None,
        vendor: None,
        tags: Some(vec!["outerwear".to_string()]),
        price_cents: Some(9900),
        suggested_price_cents: None,
        currency_code: None,
        sku: None,
        media_urls: None,
        status: None,
        ai_quality: None,
        ai_attributes: None,
      },
    )
    .await
    .expect("create");

    assert_eq!(row.title, "Jacket");
    assert_eq!(row.status, "draft");

    let listed = list_by_org(&pool, "org-list-1", Some("draft"), Pagination::new(Some(10), Some(0)))
      .await
      .expect("list");
    assert_eq!(listed.len(), 1);
  }
}
