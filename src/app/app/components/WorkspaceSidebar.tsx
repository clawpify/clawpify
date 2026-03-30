import { Link, useLocation } from "react-router-dom";
import { Show, UserButton, useOrganization, useUser } from "@clerk/react";
import { FolderIcon, InboxIcon, PackageIcon, UsersIcon } from "../../../icons/workspace-icons";
import { copy } from "../utils/copy";

function WorkspaceUserHeader() {
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();

  if (!isLoaded || !user) {
    return (
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-200/80" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="h-3.5 w-24 rounded bg-zinc-200/80" />
          <div className="h-3 w-16 rounded bg-zinc-200/60" />
        </div>
      </div>
    );
  }

  const displayName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.primaryEmailAddress?.emailAddress ||
    "Account";

  return (
    <div className="mb-4 flex items-center gap-2 px-2">
      <UserButton />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">{displayName}</p>
        {organization?.name ? (
          <p className="truncate text-xs text-zinc-500">{organization.name}</p>
        ) : null}
      </div>
    </div>
  );
}

export function WorkspaceSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const isInbox = pathname === "/app" || pathname === "/app/";
  const isProducts = pathname.startsWith("/app/products");
  const isConsignors = pathname.startsWith("/app/consignors");
  const isContracts = pathname.startsWith("/app/contracts");

  return (
    <aside
      className="sticky top-0 flex h-screen w-[250px] flex-col border-r border-zinc-200/50 bg-[#edeef0] px-3 py-3"
      style={{ fontFamily: "var(--workspace-font)" }}
    >
      <Show when="signed-in">
        <WorkspaceUserHeader />
      </Show>
      <Show when="signed-out">
        <Link
          to="/sign-in"
          className="mb-3 flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200/60 hover:text-zinc-900"
        >
          Sign in
        </Link>
      </Show>
      <div className="flex flex-col gap-0.5">
        <Link
          to="/app"
          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium transition ${
            isInbox ? "bg-zinc-200/60 text-zinc-900" : "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900"
          }`}
        >
          <InboxIcon size={18} className={isInbox ? "text-zinc-900" : "text-zinc-600"} />
          {copy.sidebar.workspace}
        </Link>
        <Link
          to="/app/products"
          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium transition ${
            isProducts ? "bg-zinc-200/60 text-zinc-900" : "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900"
          }`}
        >
          <PackageIcon size={18} className={isProducts ? "text-zinc-900" : "text-zinc-600"} />
          {copy.sidebar.products}
        </Link>
        <Link
          to="/app/consignors"
          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium transition ${
            isConsignors ? "bg-zinc-200/60 text-zinc-900" : "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900"
          }`}
        >
          <UsersIcon size={18} className={isConsignors ? "text-zinc-900" : "text-zinc-600"} />
          {copy.sidebar.consignors}
        </Link>
        <Link
          to="/app/contracts"
          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium transition ${
            isContracts ? "bg-zinc-200/60 text-zinc-900" : "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900"
          }`}
        >
          <FolderIcon size={18} className={isContracts ? "text-zinc-900" : "text-zinc-600"} />
          {copy.sidebar.contracts}
        </Link>
      </div>
    </aside>
  );
}
