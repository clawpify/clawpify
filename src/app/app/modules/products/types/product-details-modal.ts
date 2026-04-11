import type { ConsignmentListingDto } from "./listing";

export type ProductDetailsSavePayload = {
  title: string;
  sku: string;
  status: string;
  vendor: string;
  productType: string;
  tags: string[];
  priceDollars: string;
  descriptionHtml: string;
};

export type ProductDetailsModalProps = {
  listing: ConsignmentListingDto;
  open: boolean;
  saving: boolean;
  approving: boolean;
  deleting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: ProductDetailsSavePayload) => Promise<void>;
  onApprove: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export type ProductDetailsFormState = {
  title: string;
  sku: string;
  status: string;
  vendor: string;
  productType: string;
  tags: string;
  priceDollars: string;
  descriptionHtml: string;
};

export type ProductDetailsAiSummary = {
  suggestedPrice?: number;
  floorPrice?: number;
  consignorCashBuyPrice?: number;
  consignmentRangeLow?: number;
  consignmentRangeHigh?: number;
  brandDescription?: string;
  pricingReasoning?: string;
  itemDescriptionChips: string[];
  pricingChips: string[];
  sourcesSearched: string[];
};
