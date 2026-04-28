import { Link, useLocation } from "react-router-dom";
import { OrganizationSwitcher, Show } from "@clerk/react";
import { InboxIcon, PackageIcon, SettingsIcon } from "../../../icons/workspace-icons";
import { copy } from "../utils/copy";

type WorkspaceSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function WorkspaceSidebar({ className, onNavigate }: WorkspaceSidebarProps = {}) {
  const location = useLocation();
  const pathname = location.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const isProductsList =
    segments.length === 2 && segments[0] === "app" && segments[1] === "products";
  const isProductDetail =
    segments.length >= 3 && segments[0] === "app" && segments[1] === "products";
  const isSettings = segments.length >= 2 && segments[0] === "app" && segments[1] === "settings";
  const isInbox = pathname === "/app" || pathname === "/app/" || isProductsList;
  const isProducts = isProductDetail;

  return (
    <aside
      className={`flex h-full w-[250px] flex-col overflow-y-auto border-r border-zinc-200/50 bg-[#edeef0] px-3 py-3 ${className ?? ""}`}
      style={{ fontFamily: "var(--workspace-font)" }}
    >
      <Show when="signed-in">
        <div className="mb-3 px-2">
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/app/products"
            afterSelectOrganizationUrl="/app/products"
            afterLeaveOrganizationUrl="/app/products"
          />
        </div>
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
          to="/app/products"
          onClick={onNavigate}
          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium transition ${
            isInbox ? "bg-zinc-200/60 text-zinc-900" : "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900"
          }`}
        >
          <InboxIcon size={18} className={isInbox ? "text-zinc-900" : "text-zinc-600"} />
          {copy.sidebar.workspace}
        </Link>
        <Link
          to="/app/products"
          onClick={onNavigate}
          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium transition ${
            isProducts ? "bg-zinc-200/60 text-zinc-900" : "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900"
          }`}
        >
          <PackageIcon size={18} className={isProducts ? "text-zinc-900" : "text-zinc-600"} />
          {copy.sidebar.products}
        </Link>
        <Link
          to="/app/settings"
          onClick={onNavigate}
          className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium transition ${
            isSettings ? "bg-zinc-200/60 text-zinc-900" : "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900"
          }`}
        >
          <SettingsIcon size={18} className={isSettings ? "text-zinc-900" : "text-zinc-600"} />
          {copy.sidebar.settings}
        </Link>
      </div>
    </aside>
  );
}
