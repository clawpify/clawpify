import { useState } from "react";
import { StoresHeader } from "./StoresHeader";
import { StoresTable } from "./StoresTable";

export function StoresPage() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  return (
    <>
      <StoresHeader onNewStore={() => setShowConnectModal(true)} />
      <main className="flex-1 overflow-y-auto">
        <StoresTable
          showConnectModal={showConnectModal}
          onOpenConnectModal={() => setShowConnectModal(true)}
          onCloseConnectModal={() => setShowConnectModal(false)}
        />
      </main>
    </>
  );
}
