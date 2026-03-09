import { Link, useLocation } from "react-router-dom";
import { OrganizationSwitcher, UserButton, SignOutButton } from "@clerk/react";
import { copy } from "../utils/copy";

const workspaceNav = [
  { label: copy.sidebar.home, href: "/app" },
  { label: copy.sidebar.agents, href: "/app/agents" },
  { label: copy.sidebar.store, href: "/app/stores" },
  { label: copy.sidebar.search, href: "/app/search" },
  { label: copy.sidebar.reports, href: "/app/reports" },
  { label: copy.sidebar.aiVisibility, href: "/app/ai-visibility" },
];

export function WorkspaceSidebar() {
  const location = useLocation();

  return (
    <aside className="workspace-sidebar sticky top-0 flex h-screen w-60 flex-col border-r border-gray-200 bg-[#f9fafb]">
      <div className="flex shrink-0 flex-col gap-1 border-b border-gray-200 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {copy.sidebar.team}
        </p>
        <div className="min-w-0">
          <OrganizationSwitcher
            afterCreateOrganizationUrl="/app"
            afterSelectOrganizationUrl="/app"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        <input
          type="search"
          placeholder={copy.sidebar.searchPlaceholder}
          className="mb-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          {copy.sidebar.workspace}
        </p>
        {workspaceNav.map(({ label, href }) => {
          const isActive =
            href === "/app"
              ? location.pathname === "/app" || location.pathname === "/app/"
              : location.pathname.startsWith(href);
          return (
            <Link
              key={label}
              to={href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-gray-200 p-3">
        <div className="mb-2 flex items-center gap-2 px-2 text-xs text-gray-500">
          <span>{copy.sidebar.freePlan}</span>
          <span className="cursor-help">ⓘ</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <UserButton />
          <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
            <button
              type="button"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              {copy.sidebar.signOut}
            </button>
          </SignOutButton>
        </div>
      </div>
    </aside>
  );
}
