import type { ConsignmentListingDto } from "./listing";
import type { CreateListingBody } from "./api";

export type ProductsContextValue = {
  listings: ConsignmentListingDto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createListing: (body?: CreateListingBody) => Promise<ConsignmentListingDto>;
  /** Create listing then upload each image to S3 with `listing_id` (no data-URL `media_urls`). */
  createListingWithImageFiles: (body: CreateListingBody, imageFiles: File[]) => Promise<ConsignmentListingDto>;
  creating: boolean;
  createError: string | null;
  deleteListing: (id: string) => Promise<void>;
  deleting: boolean;
};
