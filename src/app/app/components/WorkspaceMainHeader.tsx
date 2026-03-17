import { useWorkspaceHeader } from "../context/WorkspaceHeaderContext";
import {
  FilterIcon,
  SortIcon,
  LayoutIcon,
  PlusIcon,
  BellIcon,
  ChevronDownIcon,
} from "../../../icons/workspace-icons";

export function WorkspaceMainHeader() {
  const { config } = useWorkspaceHeader();
  const {
    context = "All stores",
    contextIcon,
    tabs = [],
    activeTab,
    onTabChange,
    onAdd,
  } = config;

  return (
    <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: context dropdown */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200/60"
          >
            {contextIcon ?? (
              <div className="h-5 w-5 shrink-0 rounded bg-purple-200" />
            )}
            <span>{context}</span>
            <ChevronDownIcon size={16} className="shrink-0 text-zinc-500" />
          </button>
        </div>

        {/* Center: tabs */}
        {tabs.length > 0 && (
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-zinc-200/80 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              className="rounded p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900"
              aria-label="Add"
            >
              <PlusIcon size={16} />
            </button>
          </div>
        )}

        {/* Right: action icons */}
        <div className="flex items-center gap-0.5">
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="rounded p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900"
              aria-label="Add"
            >
              <PlusIcon size={18} />
            </button>
          )}
          <button
            type="button"
            className="rounded p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900"
            aria-label="Filter"
          >
            <FilterIcon size={18} />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900"
            aria-label="Sort"
          >
            <SortIcon size={18} />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900"
            aria-label="Layout"
          >
            <LayoutIcon size={18} />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900"
            aria-label="Notifications"
          >
            <BellIcon size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
