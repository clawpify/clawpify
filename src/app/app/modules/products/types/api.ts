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

export type EbayPolicyOption = {
  id: string;
  name: string;
  supports_shipping?: boolean | null;
  local_pickup?: boolean | null;
};

export type EbayLocationOption = {
  key: string;
  name: string;
};

export type CreateEbayLocationRequest = {
  name: string;
  address_line1: string;
  city: string;
  state_or_province: string;
  postal_code: string;
  country: string;
};

export type EbayPolicyDefaults = {
  org_id: string;
  marketplace_id: string;
  fulfillment_policy_id: string;
  payment_policy_id: string;
  return_policy_id: string;
  merchant_location_key?: string | null;
};

export type EbayPoliciesResponse = {
  marketplace_id: string;
  fulfillment_policies: EbayPolicyOption[];
  payment_policies: EbayPolicyOption[];
  return_policies: EbayPolicyOption[];
  locations: EbayLocationOption[];
  defaults: EbayPolicyDefaults | null;
  missing: string[];
  counts?: {
    fulfillment: number;
    payment: number;
    returns: number;
    locations: number;
  };
};

export type SaveEbayPolicyDefaultsRequest = {
  marketplace_id: string;
  fulfillment_policy_id: string;
  payment_policy_id: string;
  return_policy_id: string;
  merchant_location_key?: string | null;
};

export type EbayDraftRequest = {
  marketplace_id: string;
  category_id: string;
  condition_id: string;
  fulfillment_policy_id: string;
  payment_policy_id: string;
  return_policy_id: string;
  merchant_location_key: string;
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
