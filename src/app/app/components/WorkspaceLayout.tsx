import { useAuth } from "@clerk/react";
import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { BUN_PUBLIC_CLERK_PUBLISHABLE_KEY } from "../../../lib/constants";
import { useToast } from "../../../lib/toast";
import { copy } from "../utils/copy";
import { WorkspaceHeaderProvider } from "../context/WorkspaceHeaderContext";
import { ClawpifyLoadingScreen } from "./ClawpifyLoadingScreen";
import { WorkspaceMainHeader } from "./WorkspaceMainHeader";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

const clerkPublishableKey = BUN_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** One-time toast + strip `ebay_oauth` after OAuth hop (`/app?ebay_oauth=…`). */
function EbayOauthQueryHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const v = searchParams.get("ebay_oauth");
    if (!v) {
      handledRef.current = null;
      return;
    }
    const key = searchParams.toString();
    if (handledRef.current === key) return;
    handledRef.current = key;

    if (v === "connected") showToast(copy.products.ebayOauthToastConnected);
    else if (v === "declined") showToast(copy.products.ebayOauthToastDeclined);
    else if (v === "no_callback_params") showToast(copy.products.ebayOauthToastNoParams);

    const next = new URLSearchParams(searchParams);
    next.delete("ebay_oauth");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, showToast]);

  return null;
}

function WorkspaceChrome() {
  return (
    <div className="workspace flex min-h-screen bg-[#edeef0]">
      <EbayOauthQueryHandler />
      <WorkspaceSidebar />
      <WorkspaceHeaderProvider>
        <div className="workspace-content-panel mt-2 mr-2 mb-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-tl-xl rounded-tr-lg rounded-b-xl bg-white">
          <WorkspaceMainHeader />
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </div>
      </WorkspaceHeaderProvider>
    </div>
  );
}

function WorkspaceLayoutWithClerkAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) return <ClawpifyLoadingScreen variant="fullscreen" />;

  if (!isSignedIn) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/sign-in" replace state={{ from: returnTo }} />;
  }

  return <WorkspaceChrome />;
}

export function WorkspaceLayout() {
  if (!clerkPublishableKey) return <WorkspaceChrome />;

  return <WorkspaceLayoutWithClerkAuth />;
}
