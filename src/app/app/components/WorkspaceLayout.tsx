import { Outlet } from "react-router-dom";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

export function WorkspaceLayout() {
  return (
    <div className="workspace flex min-h-screen bg-[#f2f3f1]">
      <WorkspaceSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
