export type ListListingsQuery = {
  status?: string;
  limit?: number;
  offset?: number;
};

/** Body for POST /api/listings — all fields optional; backend applies defaults. */
export type CreateListingBody = Record<string, unknown>;

/** Body for PATCH /api/listings/:id — only send fields that change. */
export type UpdateListingBody = {
  title?: string;
  description_html?: string;
  tags?: string[];
  price_cents?: number;
  sku?: string;
};

export type EbayOAuthStatusResponse = {
  connected: boolean;
};

export type EbayOAuthStartResponse = {
  url: string;
};

export type EbaySellerSetupResponse = {
  marketplace_id: string;
  local_pickup: boolean;
  fulfillment_policies: unknown;
  payment_policies: unknown;
  return_policies: unknown;
  locations: unknown;
};

export type EbayDraftRequest = {
  marketplace_id: string;
  category_id: string;
  condition_id: string;
  fulfillment_policy_id: string;
  payment_policy_id: string;
  return_policy_id: string;
  merchant_location_key?: string;
  quantity?: number;
  aspects?: Record<string, unknown>;
  brand?: string;
  mpn?: string;
  quantity_limit_per_buyer?: number;
  include_catalog_product_details?: boolean;
};

export type EbayDraftResponse = {
  publication_id: string;
  offer_id: string;
  sku: string;
  reused_existing_offer: boolean;
};

export type EbayPublishResponse = {
  publication_id: string;
  offer_id: string;
  listing_id: string | null;
  response: unknown;
};
