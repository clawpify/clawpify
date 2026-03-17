import { useState, useEffect } from "react";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { copy } from "../../utils/copy";
import { StoresTable } from "./StoresTable";

export function StoresPage() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig({
      context: "All stores",
      tabs: [
        { id: "all", label: copy.header.allStores },
        { id: "active", label: "Active" },
        { id: "backlog", label: "Backlog" },
      ],
      activeTab: "all",
      onTabChange: () => {},
      onAdd: () => setShowConnectModal(true),
    });
    return () => setConfig({});
  }, [setConfig]);

  return (
    <main className="flex-1 overflow-y-auto">
      <StoresTable
        showConnectModal={showConnectModal}
        onOpenConnectModal={() => setShowConnectModal(true)}
        onCloseConnectModal={() => setShowConnectModal(false)}
      />
    </main>
  );
}
