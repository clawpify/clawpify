import { useState, useEffect } from "react";
import { useAuthenticatedFetch } from "../../../../lib/api";
import { copy } from "../../utils/copy";

type Store = {
  id: string;
  org_id: string;
  platform: string;
  config: { baseUrl?: string };
  created_at: string;
};

type ProductExport = {
  id: string;
  name: string;
  description?: string;
  price?: string;
  sku?: string;
  url?: string;
};

export function ProductsExport() {
  const fetchAuth = useAuthenticatedFetch();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [products, setProducts] = useState<ProductExport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchAuth("/api/stores");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load stores");
        const list = Array.isArray(data) ? data : [];
        if (!cancelled) {
          setStores(list);
          if (list.length > 0 && !selectedStoreId) {
            setSelectedStoreId(list[0].id);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setStores([]);
          setError(e instanceof Error ? e.message : "Failed to load stores");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAuth]);

  useEffect(() => {
    if (!selectedStoreId) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetchAuth(
          `/api/ai-visibility/products?store_id=${selectedStoreId}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load products");
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setProducts([]);
          setError(e instanceof Error ? e.message : "Failed to load products");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAuth, selectedStoreId]);

  const storeName = (s: Store) =>
    s.config?.baseUrl || s.platform || s.id.slice(0, 8);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-900">
        {copy.aiVisibility.productsTitle}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {copy.aiVisibility.productsDesc}
      </p>
      {stores.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">
          {copy.aiVisibility.productsEmpty}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600">
              {copy.aiVisibility.selectStore}
            </label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {storeName(s)}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                {products.length} products available for export
              </p>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob(
                    [JSON.stringify(products, null, 2)],
                    { type: "application/json" }
                  );
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `products-${selectedStoreId}.json`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {copy.aiVisibility.export}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
