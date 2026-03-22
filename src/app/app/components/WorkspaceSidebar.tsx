import { Link, useLocation } from "react-router-dom";
import { OrganizationSwitcher } from "@clerk/react";
import { HomeIcon } from "../../../icons/workspace-icons";
import { copy } from "../utils/copy";

export function WorkspaceSidebar() {
  const location = useLocation();
  const isWorkspace = location.pathname === "/app" || location.pathname.startsWith("/app/");

  return (
    <aside
      className="sticky top-0 flex h-screen w-[250px] flex-col border-r border-zinc-200/50 bg-[#edeef0] px-3 py-3"
      style={{ fontFamily: "var(--workspace-font)" }}
    >
      <div className="mb-4">
        <OrganizationSwitcher
          afterCreateOrganizationUrl="/app"
          afterSelectOrganizationUrl="/app"
          afterSelectPersonalUrl="/app"
          appearance={{
            elements: {
              rootBox: "w-full",
              organizationSwitcherTrigger:
                "flex items-center gap-2 rounded px-2 py-1.5 w-full justify-start border-0 bg-transparent hover:bg-zinc-200/60 text-sm font-medium text-zinc-900",
            },
          }}
        />
      </div>
      <Link
        to="/app"
        className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium transition ${
          isWorkspace ? "bg-zinc-200/60 text-zinc-900" : "text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900"
        }`}
      >
        <HomeIcon size={18} className={isWorkspace ? "text-zinc-900" : "text-zinc-600"} />
        {copy.sidebar.workspace}
      </Link>
    </aside>
  );
}
