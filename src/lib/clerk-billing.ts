/**
 * Org Feature slug used for upsell / `<Show when={{ feature }}>` gates.
 * Create a Feature with this slug (or override via env) on a paid org plan in
 * Clerk Dashboard → Billing.
 */
export const CLERK_PREMIUM_FEATURE_SLUG: string =
  typeof process !== "undefined"
    ? process.env.BUN_PUBLIC_CLERK_PREMIUM_FEATURE_SLUG || "premium_access"
    : "premium_access";
