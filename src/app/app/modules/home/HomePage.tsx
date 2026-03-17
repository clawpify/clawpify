import { useEffect } from "react";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { HomeContent } from "./HomeContent";

export function HomePage() {
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig({
      context: "Overview",
      tabs: [{ id: "overview", label: "Overview" }],
      activeTab: "overview",
    });
    return () => setConfig({});
  }, [setConfig]);

  return (
    <main className="flex-1 overflow-y-auto">
      <HomeContent />
    </main>
  );
}
