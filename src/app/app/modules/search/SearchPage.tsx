import { useEffect } from "react";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { copy } from "../../utils/copy";
import { SearchOptimizer } from "./SearchOptimizer";

export function SearchPage() {
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig({
      context: copy.search.header,
      tabs: [{ id: "search", label: copy.search.header }],
      activeTab: "search",
    });
    return () => setConfig({});
  }, [setConfig]);

  return (
    <main className="flex-1 overflow-y-auto">
      <SearchOptimizer />
    </main>
  );
}
