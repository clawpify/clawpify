import { useAuth } from "@clerk/react";
import { CLERK_PREMIUM_FEATURE_SLUG } from "./clerk-billing.ts";

/**
 * `true` when signed in with an active org and the org’s plan includes
 * {@link CLERK_PREMIUM_FEATURE_SLUG}. `false` when loaded but not entitled.
 * `null` while Clerk is loading.
 */
export function useOrgPaidFeature(): boolean | null {
  const { isLoaded, isSignedIn, orgId, has } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn || !orgId) return false;
  return has({ feature: CLERK_PREMIUM_FEATURE_SLUG });
}
