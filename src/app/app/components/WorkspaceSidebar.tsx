import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser, UserButton } from "@clerk/react";
import {
  HomeIcon,
  UsersIcon,
  StoreIcon,
  SearchIcon,
  ChartBarIcon,
  EyeIcon,
} from "../../../icons/workspace-icons";
import { copy } from "../utils/copy";

const workspaceNav = [
  { label: copy.sidebar.home, href: "/app", icon: HomeIcon },
  { label: copy.sidebar.agents, href: "/app/agents", icon: UsersIcon },
  { label: copy.sidebar.store, href: "/app/stores", icon: StoreIcon },
  { label: copy.sidebar.search, href: "/app/search", icon: SearchIcon },
  { label: copy.sidebar.reports, href: "/app/reports", icon: ChartBarIcon },
  { label: copy.sidebar.aiVisibility, href: "/app/ai-visibility", icon: EyeIcon },
];

export function WorkspaceSidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useUser();

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-r border-zinc-200 bg-[#f2f3f1] transition-[width] duration-200 ease-in-out ${
        isOpen ? "w-56 px-4 py-3" : "w-14 p-2"
      }`}
    >
      <div
        className={`mb-6 flex items-center gap-2 ${isOpen ? "justify-between" : "flex-col"}`}
      >
        <Link to="/app" className="flex items-center gap-2">
          <div className="h-8 w-8 shrink-0 rounded bg-[#b5ddfb]" />
          {isOpen && (
            <span className="font-mono text-sm font-medium uppercase text-zinc-900">CLAWPIFY</span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M8 5v14" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto py-1">
        {isOpen && (
          <p className="mb-1 px-2 font-mono text-xs font-medium uppercase tracking-wider text-zinc-500">
            {copy.sidebar.workspace}
          </p>
        )}

        <nav className="flex flex-col gap-1">
          {workspaceNav.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/app"
                ? location.pathname === "/app" || location.pathname === "/app/"
                : location.pathname.startsWith(href);
            return (
              <Link
                key={label}
                to={href}
                title={!isOpen ? label : undefined}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 font-mono text-xs font-medium uppercase transition ${
                  isActive ? "text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                } ${!isOpen ? "justify-center px-2" : ""}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${
                    isActive ? "bg-[#b5ddfb]" : ""
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-[#1e3a5f]" : ""} />
                </span>
                {isOpen && label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 border-t border-zinc-200 pt-3">
        <div
          className={`rounded-lg border border-zinc-200 bg-white p-2 ${
            !isOpen ? "flex justify-center" : ""
          }`}
        >
          <div
            className={`flex items-center gap-3 ${isOpen ? "" : "justify-center"}`}
          >
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8",
                  userButtonTrigger: "focus:shadow-none",
                },
              }}
            />
            {isOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-900">
                  {user?.firstName ?? user?.fullName ?? "Account"}
                </p>
                <p className="text-xs text-zinc-500">{copy.sidebar.freePlan}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
