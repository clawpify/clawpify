use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use utoipa::ToSchema;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow, ToSchema)]
pub struct EbayPolicyDefaults {
  pub org_id: String,
  pub marketplace_id: String,
  pub fulfillment_policy_id: String,
  pub payment_policy_id: String,
  pub return_policy_id: String,
  pub merchant_location_key: Option<String>,
}

pub async fn get(
  pool: &PgPool,
  org_id: &str,
  marketplace_id: &str,
) -> Result<Option<EbayPolicyDefaults>, sqlx::Error> {
  sqlx::query_as::<_, EbayPolicyDefaults>(
    r#"
    SELECT org_id, marketplace_id, fulfillment_policy_id, payment_policy_id,
           return_policy_id, merchant_location_key
    FROM ebay_policy_defaults
    WHERE org_id = $1 AND marketplace_id = $2
    "#,
  )
  .bind(org_id)
  .bind(marketplace_id)
  .fetch_optional(pool)
  .await
}

pub async fn upsert(
  pool: &PgPool,
  defaults: &EbayPolicyDefaults,
) -> Result<EbayPolicyDefaults, sqlx::Error> {
  sqlx::query("INSERT INTO organizations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING")
    .bind(&defaults.org_id)
    .execute(pool)
    .await?;

  sqlx::query_as::<_, EbayPolicyDefaults>(
    r#"
    INSERT INTO ebay_policy_defaults (
      org_id, marketplace_id, fulfillment_policy_id, payment_policy_id,
      return_policy_id, merchant_location_key, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (org_id, marketplace_id) DO UPDATE SET
      fulfillment_policy_id = EXCLUDED.fulfillment_policy_id,
      payment_policy_id = EXCLUDED.payment_policy_id,
      return_policy_id = EXCLUDED.return_policy_id,
      merchant_location_key = EXCLUDED.merchant_location_key,
      updated_at = NOW()
    RETURNING org_id, marketplace_id, fulfillment_policy_id, payment_policy_id,
              return_policy_id, merchant_location_key
    "#,
  )
  .bind(&defaults.org_id)
  .bind(&defaults.marketplace_id)
  .bind(&defaults.fulfillment_policy_id)
  .bind(&defaults.payment_policy_id)
  .bind(&defaults.return_policy_id)
  .bind(&defaults.merchant_location_key)
  .fetch_one(pool)
  .await
}
