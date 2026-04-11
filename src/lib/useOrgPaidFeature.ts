import { useOrganization } from "@clerk/react";
import { CLERK_PREMIUM_FEATURE_SLUG } from "@/lib/clerk-billing";

type OrgWithFeatures = { has?: (opts: { feature: string }) => boolean };

export function useOrgPaidFeature(): boolean | null {
  const { isLoaded, organization } = useOrganization();
  if (!isLoaded) return null;
  if (!organization) return false;
  const has = (organization as OrgWithFeatures).has;
  if (typeof has !== "function") return true;
  return has({ feature: CLERK_PREMIUM_FEATURE_SLUG });
}
