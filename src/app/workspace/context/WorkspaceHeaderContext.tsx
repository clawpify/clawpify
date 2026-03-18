import { createContext, useContext, useState, useMemo, type ReactNode } from "react";

export type WorkspaceHeaderConfig = {
  /** When true, the top workspace bar (context, tabs, actions) is not rendered. */
  hideHeader?: boolean;
  context?: string;
  contextIcon?: ReactNode;
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onAdd?: () => void;
};

const WorkspaceHeaderContext = createContext<{
  config: WorkspaceHeaderConfig;
  setConfig: (config: WorkspaceHeaderConfig | ((prev: WorkspaceHeaderConfig) => WorkspaceHeaderConfig)) => void;
} | null>(null);

export function WorkspaceHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<WorkspaceHeaderConfig>({});
  const value = useMemo(() => ({ config, setConfig }), [config]);
  return (
    <WorkspaceHeaderContext.Provider value={value}>
      {children}
    </WorkspaceHeaderContext.Provider>
  );
}

export function useWorkspaceHeader() {
  const ctx = useContext(WorkspaceHeaderContext);
  if (!ctx) return { config: {} as WorkspaceHeaderConfig, setConfig: () => {} };
  return ctx;
}
