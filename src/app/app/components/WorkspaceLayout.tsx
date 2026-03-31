import { useAuth } from "@clerk/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { WorkspaceHeaderProvider } from "../context/WorkspaceHeaderContext";
import { WorkspaceMainHeader } from "./WorkspaceMainHeader";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

const clerkPublishableKey = process.env.BUN_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

function WorkspaceChrome() {
  return (
    <div className="workspace flex min-h-screen bg-[#edeef0]">
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

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#edeef0]">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/sign-in" replace state={{ from: returnTo }} />;
  }

  return <WorkspaceChrome />;
}

export function WorkspaceLayout() {
  if (!clerkPublishableKey) {
    return <WorkspaceChrome />;
  }

  return <WorkspaceLayoutWithClerkAuth />;
}
