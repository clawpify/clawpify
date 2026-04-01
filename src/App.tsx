import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth, useOrganizationList } from "@clerk/react";
import "./index.css";
import { AppShell } from "./shell/AppShell";
import { AppTopNav } from "./shell/AppTopNav";
import { AppRoutes } from "./shell/AppRoutes";

export function App() {
  const { pathname } = useLocation();
  const fullBleed = isFullBleedShell(pathname);

  return (
    <AppShell fullBleed={fullBleed}>
      <EnsureActiveOrganization />
      {!fullBleed && <AppTopNav />}
      <AppRoutes />
    </AppShell>
  );
}

export default App;

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

/**
 * 
 * @param pathname - The pathname to check.
 * @returns 
 */
function isFullBleedShell(p: string): boolean {
  if (p === "/" || p === "/about" || p === "/privacy") return true;
  if (p === "/sign-in" || p === "/sign-up") return true;
  if (p === "/blog" || p.startsWith("/blog/")) return true;
  if (p === "/writing" || p.startsWith("/writing/")) return true;
  if (p === "/app" || p.startsWith("/app/")) return true;
  return false;
}
