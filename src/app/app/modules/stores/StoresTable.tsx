import { useEffect, useState } from "react";
import { useAuthenticatedFetch } from "../../../../lib/api";
import { copy } from "../../utils/copy";

type Store = {
  id: string;
  org_id: string;
  platform: string;
  config: { baseUrl?: string };
  created_at: string;
};

export function StoresTable({
  showConnectModal,
  onOpenConnectModal,
  onCloseConnectModal,
}: {
  showConnectModal: boolean;
  onOpenConnectModal: () => void;
  onCloseConnectModal: () => void;
}) {
  const fetchAuth = useAuthenticatedFetch();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectForm, setConnectForm] = useState({ base_url: "", platform: "url" });
  const [connecting, setConnecting] = useState(false);

  const loadStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuth("/api/stores");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load stores: ${res.status}`);
      }
      const data = await res.json();
      setStores(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stores");
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleConnectStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectForm.base_url.trim()) return;
    setConnecting(true);
    try {
      const res = await fetchAuth("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_url: connectForm.base_url.trim(),
          platform: connectForm.platform || "url",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to connect store: ${res.status}`);
      }
      setConnectForm({ base_url: "", platform: "url" });
      onCloseConnectModal();
      await loadStores();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect store");
    } finally {
      setConnecting(false);
    }
  };

  const storeName = (s: Store) => s.config?.baseUrl || s.platform || s.id.slice(0, 8);

  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {copy.storesTable.columns.name}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {copy.storesTable.platform}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {copy.storesTable.columns.status}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : stores.length === 0 ? (
              <tr className="border-b border-gray-100 transition hover:bg-gray-50">
                <td colSpan={3} className="px-4 py-12 text-center">
                  <div className="mx-auto max-w-sm">
                    <p className="text-sm font-medium text-gray-900">
                      {copy.storesTable.empty}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {copy.storesTable.emptyDesc}
                    </p>
                    <button
                      type="button"
                      onClick={onOpenConnectModal}
                      className="mt-4 rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                    >
                      {copy.storesTable.connectStore}
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr
                  key={store.id}
                  className="border-b border-gray-100 transition hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {storeName(store)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                    {store.platform}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {copy.storesTable.onTrack}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              {copy.storesTable.connectStore}
            </h2>
            <form onSubmit={handleConnectStore} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {copy.storesTable.baseUrl}
                </label>
                <input
                  type="url"
                  value={connectForm.base_url}
                  onChange={(e) =>
                    setConnectForm((f) => ({ ...f, base_url: e.target.value }))
                  }
                  placeholder={copy.storesTable.baseUrlPlaceholder}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {copy.storesTable.platform}
                </label>
                <select
                  value={connectForm.platform}
                  onChange={(e) =>
                    setConnectForm((f) => ({ ...f, platform: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="url">{copy.storesTable.platformUrl}</option>
                  <option value="shopify">{copy.storesTable.platformShopify}</option>
                  <option value="woocommerce">
                    {copy.storesTable.platformWooCommerce}
                  </option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseConnectModal}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {copy.storesTable.close}
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {connecting ? "Connecting..." : "Connect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
