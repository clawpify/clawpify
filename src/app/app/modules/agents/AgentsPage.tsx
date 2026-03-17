import { useEffect } from "react";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { copy } from "../../utils/copy";
import { AgentsContent } from "./AgentsContent";

export function AgentsPage() {
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig({
      context: copy.agents.header,
      tabs: [{ id: "agents", label: copy.agents.header }],
      activeTab: "agents",
    });
    return () => setConfig({});
  }, [setConfig]);

  return (
    <main className="flex-1 overflow-y-auto">
      <AgentsContent />
    </main>
  );
}
