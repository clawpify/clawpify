import { useRef } from "react";
import { PlusIcon, SearchIcon, XMarkIcon } from "../../../../../icons/workspace-icons";
import { copy } from "../../../utils/copy";
import type { ProductStatusTab } from "../types";

const TAB_KEYS: ProductStatusTab[] = ["all", "active", "draft", "archived"];

type Props = {
  statusTab: ProductStatusTab;
  onStatusTab: (t: ProductStatusTab) => void;
  searchQuery: string;
  onSearchQuery: (q: string) => void;
  onOpenCreate: () => void;
  creating: boolean;
};

const shortTabLabel: Record<ProductStatusTab, string> = {
  all: copy.products.tabAll,
  active: copy.products.tabActive,
  draft: copy.products.tabDraft,
  archived: copy.products.tabArchived,
};

const roundActionClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800";

export function ProductsInventoryToolbar({
  statusTab,
  onStatusTab,
  searchQuery,
  onSearchQuery,
  onOpenCreate,
  creating,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className="shrink-0 pt-2" style={{ fontFamily: "var(--workspace-font)" }}>
      <h1 className="sr-only">{copy.products.pageHeading}</h1>

      {/* Full-bleed rule: cancel ProductsPage px-4 sm:px-6 so the divider spans the content column */}
      <div className="-mx-4 border-b border-zinc-200/70 px-4 pb-2.5 sm:-mx-6 sm:px-6">
        <div className="relative">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            ref={searchRef}
            type="text"
            role="searchbox"
            value={searchQuery}
            onChange={(e) => onSearchQuery(e.target.value)}
            placeholder={copy.products.toolbarSearchPlaceholder}
            autoComplete="off"
            className={`w-full border-0 bg-transparent py-0.5 pl-8 text-sm text-zinc-800 placeholder:text-zinc-400/90 focus:outline-none focus:ring-0 ${
              searchQuery ? "pr-9" : "pr-0"
            }`}
            aria-label={copy.products.searchProducts}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                onSearchQuery("");
                searchRef.current?.focus();
              }}
              className="absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              aria-label={copy.products.clearSearch}
            >
              <XMarkIcon size={15} className="text-current" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 pt-2.5">
        <div
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
          role="tablist"
          aria-label={copy.products.tabListLabel}
        >
          {TAB_KEYS.map((key) => {
            const selected = statusTab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onStatusTab(key)}
                className={`rounded-full px-3 py-1 text-[13px] font-medium transition sm:text-sm ${
                  selected
                    ? "bg-zinc-100 text-zinc-800"
                    : "border border-zinc-200/80 bg-white text-zinc-600 hover:border-zinc-300/90 hover:bg-zinc-50"
                }`}
              >
                {shortTabLabel[key]}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          disabled={creating}
          title={`${copy.products.addProduct} (${copy.products.shortcutCreate})`}
          aria-label={copy.products.addProduct}
          className={`${roundActionClass} disabled:opacity-40 disabled:hover:border-zinc-200/80 disabled:hover:bg-white disabled:hover:text-zinc-600`}
        >
          <PlusIcon size={17} className="text-current" />
        </button>
      </div>
    </div>
  );
}
