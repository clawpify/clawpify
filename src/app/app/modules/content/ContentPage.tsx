import { useEffect } from "react";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { copy } from "../../utils/copy";
import { ContentEditor } from "./ContentEditor";

export function ContentPage() {
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig({
      context: copy.content.header,
      tabs: [
        { id: "all", label: "All" },
        { id: "drafts", label: "Drafts" },
      ],
      activeTab: "all",
    });
    return () => setConfig({});
  }, [setConfig]);

  return (
    <main className="flex-1 overflow-y-auto">
      <ContentEditor />
    </main>
  );
}
