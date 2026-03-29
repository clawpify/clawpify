use chrono::{DateTime, Duration, Utc};
use serde::Serialize;
use sqlx::{PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use crate::dto::contracts::{ContractCreateRequest, ContractPatchRequest};
use crate::models::contracts::Contract;
use super::pagination::Pagination;

pub async fn consignor_in_org(
  pool: &PgPool,
  org_id: &str,
  consignor_id: Uuid,
) -> Result<bool, sqlx::Error> {
  let ok: bool = sqlx::query_scalar(
    r#"SELECT EXISTS(
         SELECT 1 FROM consignors WHERE id = $1 AND org_id = $2
       )"#,
  )
  .bind(consignor_id)
  .bind(org_id)
  .fetch_one(pool)
  .await?;
  Ok(ok)
}

pub async fn get_consignor_id(
  pool: &PgPool,
  org_id: &str,
  contract_id: Uuid,
) -> Result<Option<Uuid>, sqlx::Error> {
  sqlx::query_scalar(
    r#"SELECT consignor_id FROM contracts WHERE id = $1 AND org_id = $2"#,
  )
  .bind(contract_id)
  .bind(org_id)
  .fetch_optional(pool)
  .await
}

pub async fn list(
  pool: &PgPool,
  org_id: &str,
  consignor_id: Option<Uuid>,
  status: Option<&str>,
  page: Pagination,
) -> Result<Vec<Contract>, sqlx::Error> {
  let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(
    r#"SELECT id, org_id, consignor_id, contract_type, status, start_at, end_at,
              consignor_split_bps, store_split_bps, donation_price_cutoff_cents,
              opt_out_under_threshold_donation, terms_version, notes, created_at, updated_at
       FROM contracts
       WHERE org_id ="#,
  );
  qb.push_bind(org_id);
  if let Some(cid) = consignor_id {
    qb.push(" AND consignor_id = ");
    qb.push_bind(cid);
  }
  if let Some(s) = status {
    qb.push(" AND status = ");
    qb.push_bind(s);
  }
  qb.push(" ORDER BY created_at DESC LIMIT ");
  qb.push_bind(page.limit);
  qb.push(" OFFSET ");
  qb.push_bind(page.offset);
  qb.build_query_as::<Contract>().fetch_all(pool).await
}

pub async fn get_by_id(
  pool: &PgPool,
  org_id: &str,
  id: Uuid,
) -> Result<Option<Contract>, sqlx::Error> {
  sqlx::query_as::<_, Contract>(
    r#"SELECT id, org_id, consignor_id, contract_type, status, start_at, end_at,
              consignor_split_bps, store_split_bps, donation_price_cutoff_cents,
              opt_out_under_threshold_donation, terms_version, notes, created_at, updated_at
       FROM contracts
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
  body: ContractCreateRequest,
) -> Result<Contract, sqlx::Error> {
  sqlx::query_as::<_, Contract>(
    r#"INSERT INTO contracts (
         org_id, consignor_id, contract_type, status, start_at, end_at,
         consignor_split_bps, store_split_bps, donation_price_cutoff_cents,
         opt_out_under_threshold_donation, terms_version, notes
       )
       VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, org_id, consignor_id, contract_type, status, start_at, end_at,
                 consignor_split_bps, store_split_bps, donation_price_cutoff_cents,
                 opt_out_under_threshold_donation, terms_version, notes, created_at, updated_at"#,
  )
  .bind(org_id)
  .bind(body.consignor_id)
  .bind(&body.contract_type)
  .bind(body.start_at)
  .bind(body.end_at)
  .bind(body.consignor_split_bps)
  .bind(body.store_split_bps)
  .bind(body.donation_price_cutoff_cents)
  .bind(body.opt_out_under_threshold_donation)
  .bind(body.terms_version.as_deref())
  .bind(body.notes.as_deref())
  .fetch_one(pool)
  .await
}

pub async fn update(
  pool: &PgPool,
  org_id: &str,
  id: Uuid,
  patch: ContractPatchRequest,
) -> Result<Option<Contract>, sqlx::Error> {
  sqlx::query_as::<_, Contract>(
    r#"UPDATE contracts SET
         status = COALESCE($3, status),
         notes = COALESCE($4, notes),
         opt_out_under_threshold_donation = COALESCE($5, opt_out_under_threshold_donation),
         end_at = COALESCE($6, end_at),
         terms_version = COALESCE($7, terms_version),
         updated_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING id, org_id, consignor_id, contract_type, status, start_at, end_at,
                 consignor_split_bps, store_split_bps, donation_price_cutoff_cents,
                 opt_out_under_threshold_donation, terms_version, notes, created_at, updated_at"#,
  )
  .bind(id)
  .bind(org_id)
  .bind(patch.status.as_deref())
  .bind(patch.notes.as_deref())
  .bind(patch.opt_out_under_threshold_donation)
  .bind(patch.end_at)
  .bind(patch.terms_version.as_deref())
  .fetch_optional(pool)
  .await
}

#[derive(sqlx::FromRow)]
struct ListingDispositionRow {
  id: Uuid,
  price_cents: i64,
  post_contract_disposition: Option<String>,
}

#[derive(Serialize)]
pub struct ContractSummary {
  pub contract_id: Uuid,
  pub listing_count: i64,
  pub by_disposition: serde_json::Value,
  pub by_acceptance: serde_json::Value,
}

pub async fn contract_summary(
  pool: &PgPool,
  org_id: &str,
  contract_id: Uuid,
) -> Result<Option<ContractSummary>, sqlx::Error> {
  let exists = get_by_id(pool, org_id, contract_id).await?;
  if exists.is_none() {
    return Ok(None);
  }

  let listing_count: i64 =
    sqlx::query_scalar(r#"SELECT COUNT(*)::bigint FROM consignment_listings WHERE org_id = $1 AND contract_id = $2"#)
      .bind(org_id)
      .bind(contract_id)
      .fetch_one(pool)
      .await?;

  let disp_rows: Vec<(Option<String>, i64)> = sqlx::query_as(
    r#"SELECT post_contract_disposition, COUNT(*)::bigint
       FROM consignment_listings
       WHERE org_id = $1 AND contract_id = $2
       GROUP BY post_contract_disposition"#,
  )
  .bind(org_id)
  .bind(contract_id)
  .fetch_all(pool)
  .await?;

  let mut disp_counts: std::collections::HashMap<&'static str, i64> =
    std::collections::HashMap::from([
      ("pickup_eligible", 0),
      ("donate_eligible", 0),
      ("donated", 0),
      ("picked_up", 0),
      ("unset", 0),
    ]);
  for (k, n) in disp_rows {
    let key = match k.as_deref() {
      Some("pickup_eligible") => "pickup_eligible",
      Some("donate_eligible") => "donate_eligible",
      Some("donated") => "donated",
      Some("picked_up") => "picked_up",
      _ => "unset",
    };
    *disp_counts.entry(key).or_insert(0) += n;
  }
  let by_disposition = serde_json::to_value(&disp_counts).unwrap_or(serde_json::json!({}));

  let acc_rows: Vec<(Option<String>, i64)> = sqlx::query_as(
    r#"SELECT acceptance_status, COUNT(*)::bigint
       FROM consignment_listings
       WHERE org_id = $1 AND contract_id = $2
       GROUP BY acceptance_status"#,
  )
  .bind(org_id)
  .bind(contract_id)
  .fetch_all(pool)
  .await?;

  let mut acc_counts: std::collections::HashMap<&'static str, i64> =
    std::collections::HashMap::from([
      ("pending", 0),
      ("accepted", 0),
      ("declined", 0),
      ("unset", 0),
    ]);
  for (k, n) in acc_rows {
    let key = match k.as_deref() {
      Some("pending") => "pending",
      Some("accepted") => "accepted",
      Some("declined") => "declined",
      _ => "unset",
    };
    *acc_counts.entry(key).or_insert(0) += n;
  }
  let by_acceptance = serde_json::to_value(&acc_counts).unwrap_or(serde_json::json!({}));

  Ok(Some(ContractSummary {
    contract_id,
    listing_count,
    by_disposition,
    by_acceptance,
  }))
}

#[derive(Serialize)]
pub struct RunExpiryOutcome {
  pub updated: u64,
  pub details: Vec<RunExpiryDetail>,
}

#[derive(Serialize)]
pub struct RunExpiryDetail {
  pub listing_id: Uuid,
  pub from: Option<String>,
  pub to: String,
}

pub async fn run_expiry_rules(
  pool: &PgPool,
  org_id: &str,
  contract_id: Uuid,
  as_of: DateTime<Utc>,
) -> Result<Option<RunExpiryOutcome>, sqlx::Error> {
  let contract = match get_by_id(pool, org_id, contract_id).await? {
    Some(c) => c,
    None => return Ok(None),
  };

  let grace_end = contract.end_at + Duration::days(7);

  let rows = sqlx::query_as::<_, ListingDispositionRow>(
    r#"SELECT id, price_cents, post_contract_disposition
       FROM consignment_listings
       WHERE org_id = $1 AND contract_id = $2"#,
  )
  .bind(org_id)
  .bind(contract_id)
  .fetch_all(pool)
  .await?;

  let mut details = Vec::new();
  let mut updated: u64 = 0;

  for row in rows {
    let mut next = if row.price_cents > contract.donation_price_cutoff_cents {
      "pickup_eligible".to_string()
    } else if contract.opt_out_under_threshold_donation {
      "pickup_eligible".to_string()
    } else {
      "donate_eligible".to_string()
    };

    if as_of >= grace_end
      && contract.contract_type == "donate_on"
      && next == "donate_eligible"
    {
      next = "donated".to_string();
    }

    if row.post_contract_disposition.as_deref() == Some(next.as_str()) {
      continue;
    }

    sqlx::query(
      r#"UPDATE consignment_listings
         SET post_contract_disposition = $3, updated_at = NOW()
         WHERE id = $1 AND org_id = $2"#,
    )
    .bind(row.id)
    .bind(org_id)
    .bind(&next)
    .execute(pool)
    .await?;

    updated += 1;
    details.push(RunExpiryDetail {
      listing_id: row.id,
      from: row.post_contract_disposition,
      to: next,
    });
  }

  Ok(Some(RunExpiryOutcome { updated, details }))
}
