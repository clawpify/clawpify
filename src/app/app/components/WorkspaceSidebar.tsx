import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser, useOrganization, UserButton, OrganizationSwitcher } from "@clerk/react";
import {
  HomeIcon,
  StoreIcon,
  SearchIcon,
  EyeIcon,
  ChartBarIcon,
  UsersIcon,
  InboxIcon,
  SettingsIcon,
  PlusIcon,
  FolderIcon,
  InviteIcon,
  LinkIcon,
  BugIcon,
  ChevronDownIcon,
} from "../../../icons/workspace-icons";
import { copy } from "../utils/copy";

const topNav = [
  { label: copy.sidebar.inbox, href: "/app", icon: InboxIcon },
  { label: copy.sidebar.myStores, href: "/app/stores", icon: StoreIcon },
];

const workspaceNav = [
  { label: copy.sidebar.home, href: "/app", icon: HomeIcon },
  { label: copy.sidebar.store, href: "/app/stores", icon: StoreIcon },
  { label: copy.sidebar.content, href: "/app/content", icon: FolderIcon },
  { label: copy.sidebar.search, href: "/app/search", icon: SearchIcon },
  { label: copy.sidebar.reports, href: "/app/reports", icon: ChartBarIcon },
  { label: copy.sidebar.agents, href: "/app/agents", icon: UsersIcon },
];

const teamNav = [
  { label: copy.sidebar.issues, href: "/app/stores", icon: BugIcon },
  { label: copy.sidebar.projects, href: "/app/content", icon: FolderIcon },
  { label: copy.sidebar.views, href: "/app/reports", icon: EyeIcon },
];

const tryNav = [
  { label: copy.sidebar.connectStore, href: "/app/stores", icon: LinkIcon },
  { label: copy.sidebar.invitePeople, href: "/app", icon: InviteIcon },
];

function NavLink({
  label,
  href,
  icon: Icon,
  isActive,
  isOpen,
}: {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  isActive: boolean;
  isOpen: boolean;
}) {
  return (
    <Link
      to={href}
      title={!isOpen ? label : undefined}
      className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm font-normal normal-case text-zinc-700 transition hover:text-zinc-900 ${
        isActive ? "text-zinc-900" : ""
      } ${isOpen ? "" : "justify-center"}`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        <Icon size={18} className={isActive ? "text-zinc-900" : "text-zinc-600"} />
      </span>
      {isOpen && label}
    </Link>
  );
}

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  isSidebarOpen,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isSidebarOpen: boolean;
}) {
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm font-medium text-zinc-700 transition hover:text-zinc-900 ${
          isSidebarOpen ? "" : "justify-center"
        }`}
      >
        {isSidebarOpen && (
          <>
            <span className="flex-1 text-left">{title}</span>
            <ChevronDownIcon
              size={16}
              className={`shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`}
            />
          </>
        )}
      </button>
      {isOpen && isSidebarOpen && <div className="ml-2 flex flex-col gap-0.5 border-l border-zinc-200 pl-2">{children}</div>}
    </div>
  );
}

export function WorkspaceSidebar() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [tryOpen, setTryOpen] = useState(false);
  const { user } = useUser();
  const { organization } = useOrganization();

  const isActive = (href: string) => {
    if (href === "/app") return location.pathname === "/app" || location.pathname === "/app/";
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col bg-[#edeef0] transition-[width] duration-200 ease-in-out ${
        sidebarOpen ? "w-56 px-3 py-3" : "w-14 p-2"
      }`}
      style={{ fontFamily: "var(--workspace-font)" }}
    >
      {/* Header bar */}
      <div
        className={`mb-4 flex items-center gap-2 ${sidebarOpen ? "justify-between" : "flex-col"}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {sidebarOpen ? (
            <OrganizationSwitcher
              afterCreateOrganizationUrl="/app"
              afterSelectOrganizationUrl="/app"
              afterSelectPersonalUrl="/app"
              appearance={{
                elements: {
                  rootBox: "flex-1 min-w-0",
                  organizationSwitcherTrigger:
                    "flex items-center gap-2 rounded px-2 py-1.5 w-full justify-start border-0 bg-transparent hover:bg-zinc-200/60 text-sm font-medium text-zinc-900",
                },
              }}
            />
          ) : (
            <Link to="/app" className="flex shrink-0 items-center justify-center">
              <div className="h-6 w-6 rounded bg-[#b5ddfb]" />
            </Link>
          )}
        </div>
        {sidebarOpen && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="rounded p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900"
              aria-label="Search"
            >
              <SearchIcon size={18} />
            </button>
            <Link
              to="/settings"
              className="rounded p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900"
              aria-label="Settings"
            >
              <SettingsIcon size={18} />
            </Link>
            <button
              type="button"
              className="rounded p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900"
              aria-label="Add"
            >
              <PlusIcon size={18} />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="rounded p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg
            width="18"
            height="18"
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

      {/* Top nav */}
      <nav className="mb-4 flex flex-col gap-0.5">
        {topNav.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={label}
            label={label}
            href={href}
            icon={Icon}
            isActive={isActive(href)}
            isOpen={sidebarOpen}
          />
        ))}
      </nav>

      {/* Scrollable middle */}
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto py-1">
        <CollapsibleSection
          title={copy.sidebar.workspace}
          isOpen={workspaceOpen}
          onToggle={() => setWorkspaceOpen((o) => !o)}
          isSidebarOpen={sidebarOpen}
        >
          {workspaceNav.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={label}
              label={label}
              href={href}
              icon={Icon}
              isActive={isActive(href)}
              isOpen={sidebarOpen}
            />
          ))}
        </CollapsibleSection>

        <CollapsibleSection
          title={copy.sidebar.yourTeams}
          isOpen={teamsOpen}
          onToggle={() => setTeamsOpen((o) => !o)}
          isSidebarOpen={sidebarOpen}
        >
          {sidebarOpen && (
            <div className="mb-1 flex items-center gap-2 px-2 py-1 text-xs font-medium text-zinc-600">
              {organization?.name ?? copy.sidebar.personal}
            </div>
          )}
          {teamNav.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={label}
              label={label}
              href={href}
              icon={Icon}
              isActive={isActive(href)}
              isOpen={sidebarOpen}
            />
          ))}
        </CollapsibleSection>

        <CollapsibleSection
          title={copy.sidebar.try}
          isOpen={tryOpen}
          onToggle={() => setTryOpen((o) => !o)}
          isSidebarOpen={sidebarOpen}
        >
          {tryNav.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={label}
              label={label}
              href={href}
              icon={Icon}
              isActive={isActive(href)}
              isOpen={sidebarOpen}
            />
          ))}
        </CollapsibleSection>
      </div>

      {/* Footer links */}
      {sidebarOpen && (
        <div className="mb-2 flex gap-2 px-2 py-1 text-xs text-zinc-500">
          <Link to="/app" className="transition hover:text-zinc-700">
            {copy.sidebar.whatsNew}
          </Link>
          <Link to="/app" className="transition hover:text-zinc-700">
            {copy.sidebar.uiRefresh}
          </Link>
        </div>
      )}

      {/* User footer */}
      <div className="shrink-0 border-t border-zinc-200 pt-3">
        <div
          className={`rounded-lg bg-zinc-100/80 p-2 ${!sidebarOpen ? "flex justify-center" : ""}`}
        >
          <div
            className={`flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}
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
            {sidebarOpen && (
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
