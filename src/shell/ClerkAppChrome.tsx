import { useEffect } from "react";
import { useAuth, useOrganizationList } from "@clerk/react";
import { AppTopNav } from "./AppTopNav";

type ClerkAppChromeProps = {
  fullBleed: boolean;
};

function EnsureActiveOrganization() {
  const { userId, orgId } = useAuth();
  const { isLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: true,
  });

  useEffect(() => {
    if (!userId || orgId || !isLoaded || !setActive) return;

    const firstMembership = userMemberships.data?.[0];
    const firstOrgId = firstMembership?.organization.id;
    if (!firstOrgId) return;

    void setActive({ organization: firstOrgId }).catch((error) => {
      console.error("Failed to auto-activate organization", error);
    });
  }, [isLoaded, orgId, setActive, userId, userMemberships.data]);

  return null;
}

export function ClerkAppChrome({ fullBleed }: ClerkAppChromeProps) {
  return (
    <>
      <EnsureActiveOrganization />
      {!fullBleed && <AppTopNav />}
    </>
  );
}
