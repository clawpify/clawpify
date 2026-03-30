import { useEffect } from "react";
import { useWorkspaceHeader } from "../../../context/WorkspaceHeaderContext";
import { ProductsProvider, useProducts } from "../context/ProductsContext";
import { copy } from "../../../utils/copy";
import { ProductsEmptyState } from "./ProductsEmptyState";
import { ProductsTable } from "./ProductsTable";

function ProductsPageInner() {
  const { listings, loading, error, refetch } = useProducts();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">{copy.products.title}</h2>
              <p className="mt-2 text-sm text-zinc-500">{copy.products.subtitle}</p>
            </div>
            {error ? (
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                {copy.products.retry}
              </button>
            ) : null}
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-zinc-500">{copy.products.loading}</p>
          ) : error ? (
            <p className="mt-8 text-sm text-red-600" role="alert">
              {copy.products.loadErrorPrefix} {error}
            </p>
          ) : listings.length === 0 ? (
            <ProductsEmptyState />
          ) : (
            <ProductsTable listings={listings} />
          )}
        </div>
      </div>
    </main>
  );
}

export function ProductsPage() {
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig({ hideHeader: true });
    return () => setConfig({});
  }, [setConfig]);

  return (
    <ProductsProvider>
      <ProductsPageInner />
    </ProductsProvider>
  );
}
