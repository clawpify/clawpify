/** Mirrors [`ConsignmentListing`](backend/src/models/consignment_listing.rs) JSON from GET /api/listings. */
export type ConsignmentListingDto = {
  id: string;
  org_id: string;
  created_by_user_id: string | null;
  status: string;
  title: string;
  description_html: string;
  product_type: string;
  vendor: string;
  tags: string[];
  price_cents: number;
  currency_code: string;
  sku: string;
  media_urls: unknown;
  ai_quality: unknown | null;
  ai_attributes: unknown | null;
  suggested_price_cents: number | null;
  created_at: string;
  updated_at: string;
  consignor_id: string | null;
  contract_id: string | null;
  acceptance_status: string | null;
  decline_reason: string | null;
  post_contract_disposition: string | null;
};

export type ProductIntakeDraft = {
  clientId: string;
  images: ProductIntakeImage[];
  model: string;
  originalPrice: string;
  isUsed: boolean;
  notes: string;
};

export type ProductIntakeImage = {
  imageId: string;
  file: File;
  previewUrl: string;
};

export type ProductAiParsed = {
  durationMs?: number;
  suggestedPrice?: number;
  floorPrice?: number;
  consignorCashBuyPrice?: number;
  consignmentRangeLow?: number;
  consignmentRangeHigh?: number;
  suggestedDescription?: string;
  brandDescription?: string;
  pricingReasoning?: string;
  itemDescriptionChips?: string[];
  pricingChips?: string[];
  title?: string;
  sourcesSearched?: string[];
};

export type ProductProcessResult = {
  clientId: string;
  status: "created" | "failed";
  listingId?: string | null;
  parsed?: ProductAiParsed;
  error?: string;
};
