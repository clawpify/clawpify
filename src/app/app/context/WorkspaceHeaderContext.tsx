import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type WorkspaceHeaderConfig = {
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
  return (
    <WorkspaceHeaderContext.Provider value={{ config, setConfig }}>
      {children}
    </WorkspaceHeaderContext.Provider>
  );
}

export function useWorkspaceHeader() {
  const ctx = useContext(WorkspaceHeaderContext);
  if (!ctx) return { config: {} as WorkspaceHeaderConfig, setConfig: () => {} };
  return ctx;
}
