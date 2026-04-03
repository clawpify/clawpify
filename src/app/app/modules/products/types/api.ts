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
};
