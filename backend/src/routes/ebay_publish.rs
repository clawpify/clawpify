
async fn publish_listing_to_ebay(
  State(state): State<AppState>,
  org: OrgId,
  Path(listing_id): Path<Uuid>,
  Json(body): Json<PublishListingRequest>,
) -> Result<Json<serde_json::Value>, ApiError> {
  let crypto = state.token_crypto.as_ref().ok_or(...)?;
  let cfg = state.ebay_config.as_ref().ok_or(...)?;
  let org_id = org.as_str();

  let lising = listings::get_by_id(&state.pool, org_id, listing_id)
    .await
    .ok_or(ApiErorr::not_found(...))?;

  let ebay_row = channel_connections::get_ebay_secrets(&state.pool, org_id)
    .await?
    .ok_or(ApiError::bad_request("Connect eBay first"))?;
  
    let ts = EbayTokenService { pool: &state.pool, cfg, crypto };
    let bearer = ts.bearer_for_org(org_id).await.map_err(...)?;

    let inv = EbayInventory { pool: &state.pool, cfg, crypto };

    inv.put_inventory_item(...).await.map_err(...)?;

    let offer_id = inv.create_offer(...).await?;
    let published = inv.publish_offer(&offer_id).await?;
    let snapshot = json!({
      "sku": listing.sku,
      "offerId": offer_id,
      "listingId": published["listingId"],
    });

    listing_publications::insert(
      &state.pool, 
      listing.id, 
      ebay_row.id,
      "ebay", 
      "success", 
      None, 
      Some(snapshot), 
      None,
    )
    .await?;

    Ok(Json(snapshot))
}