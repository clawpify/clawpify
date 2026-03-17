import { useEffect } from "react";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { copy } from "../../utils/copy";
import { ReportsContent } from "./ReportsContent";

export function ReportsPage() {
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig({
      context: copy.reports.header,
      tabs: [{ id: "reports", label: copy.reports.header }],
      activeTab: "reports",
    });
    return () => setConfig({});
  }, [setConfig]);

  return (
    <main className="flex-1 overflow-y-auto">
      <ReportsContent />
    </main>
  );
}
