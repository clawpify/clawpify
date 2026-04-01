//! stored_images repository + org FK.

mod common;

use sqlx::PgPool;

use backend::repositories::stored_images;
use common::ensure_org;

#[sqlx::test(migrations = "../migrations")]
async fn stored_images_insert_and_delete(pool: PgPool) {
  ensure_org(&pool, "org-stored-img").await;

  let org = "org-stored-img";
  let user = "user-1";
  let key = format!("uploads/{org}/{user}/00000000-0000-0000-0000-000000000001_smoke.png");

  stored_images::insert(
    &pool,
    org,
    user,
    &key,
    "image/png",
    1024,
    "smoke.png",
  )
  .await
  .expect("insert");

  let count: (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM stored_images WHERE storage_key = $1")
    .bind(&key)
    .fetch_one(&pool)
    .await
    .expect("count");
  assert_eq!(count.0, 1);

  let n = stored_images::delete_by_org_and_key(&pool, org, &key).await.expect("delete");
  assert_eq!(n, 1);

  let count: (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM stored_images WHERE storage_key = $1")
    .bind(&key)
    .fetch_one(&pool)
    .await
    .expect("count");
  assert_eq!(count.0, 0);
}

#[sqlx::test(migrations = "../migrations")]
async fn stored_images_insert_fails_without_organization(pool: PgPool) {
  let err = stored_images::insert(
    &pool,
    "org-not-in-db",
    "user-1",
    "uploads/org-not-in-db/user-1/00000000-0000-0000-0000-000000000022_x.png",
    "image/png",
    1,
    "x.png",
  )
  .await;
  assert!(err.is_err(), "insert should fail: organizations FK");
}

#[sqlx::test(migrations = "../migrations")]
async fn stored_images_duplicate_storage_key_fails(pool: PgPool) {
  ensure_org(&pool, "org-dup-storage-key").await;
  let org = "org-dup-storage-key";
  let key = "uploads/org-dup-storage-key/u/22222222-2222-2222-2222-222222222222_dup.png";

  stored_images::insert(&pool, org, "u", key, "image/png", 1, "dup.png")
    .await
    .expect("first insert");

  let second = stored_images::insert(&pool, org, "u", key, "image/png", 2, "dup.png").await;
  assert!(second.is_err(), "unique storage_key");
}
