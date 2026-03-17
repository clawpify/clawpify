import { Outlet } from "react-router-dom";
import { WorkspaceHeaderProvider } from "../context/WorkspaceHeaderContext";
import { WorkspaceMainHeader } from "./WorkspaceMainHeader";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

export function WorkspaceLayout() {
  return (
    <div className="workspace flex min-h-screen bg-[#f2f3f1]">
      <WorkspaceSidebar />
      <WorkspaceHeaderProvider>
        <div className="flex flex-1 flex-col min-w-0 mt-2 bg-white rounded-tl-xl shadow-sm overflow-hidden">
          <WorkspaceMainHeader />
          <Outlet />
        </div>
      </WorkspaceHeaderProvider>
    </div>
  );
}
