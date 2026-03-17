import { Outlet } from "react-router-dom";
import { WorkspaceHeaderProvider } from "../context/WorkspaceHeaderContext";
import { WorkspaceMainHeader } from "./WorkspaceMainHeader";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

export function WorkspaceLayout() {
  return (
    <div className="workspace flex min-h-screen bg-[#edeef0]">
      <WorkspaceSidebar />
      <WorkspaceHeaderProvider>
        <div className="workspace-content-panel flex flex-1 flex-col min-w-0 mt-2 mr-2 mb-2 bg-white rounded-tl-xl rounded-tr-lg rounded-b-xl overflow-hidden">
          <WorkspaceMainHeader />
          <Outlet />
        </div>
      </WorkspaceHeaderProvider>
    </div>
  );
}
