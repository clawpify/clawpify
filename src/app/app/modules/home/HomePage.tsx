import { useEffect } from "react";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { HomeContent } from "./HomeContent";

export function HomePage() {
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig({ hideHeader: true });
    return () => setConfig({});
  }, [setConfig]);

  return (
    <main
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
      style={{ fontFamily: "var(--workspace-font)" }}
    >
      <HomeContent />
    </main>
  );
}
