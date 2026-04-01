import { useState } from "react";
import { Outlet } from "react-router-dom";
import { WorkspaceHeaderProvider } from "../context/WorkspaceHeaderContext";
import { WorkspaceMainHeader } from "./WorkspaceMainHeader";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

export function WorkspaceLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="workspace flex min-h-screen bg-[#edeef0]">
      <button
        type="button"
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 bg-white/90 text-zinc-700 shadow-sm backdrop-blur-sm md:hidden"
        aria-label="Open navigation menu"
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
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-label="Navigation menu">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/35"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close navigation menu"
            tabIndex={-1}
          />
          <div className="relative z-10 h-full w-[250px] bg-[#edeef0] shadow-xl">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900"
              aria-label="Close navigation menu"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <WorkspaceSidebar className="h-full border-r-0 pt-14" onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <WorkspaceSidebar className="sticky top-0 hidden h-screen md:flex" />
      <WorkspaceHeaderProvider>
        <div className="workspace-content-panel m-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-white md:ml-0 md:rounded-tl-xl md:rounded-tr-lg md:rounded-b-xl">
          <WorkspaceMainHeader />
          <Outlet />
        </div>
      </WorkspaceHeaderProvider>
    </div>
  );
}
