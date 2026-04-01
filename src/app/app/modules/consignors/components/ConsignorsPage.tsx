import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWorkspaceHeader } from "../../../context/WorkspaceHeaderContext";
import { copy } from "../../../utils/copy";
import { useAuthenticatedFetch } from "../../../../../lib/api";
import type { ConsignorDto } from "../types";
import { createConsignorWithClerkUser, listConsignors } from "../utils/consignorsApi";
import { useOrganization } from "@clerk/react";

export function ConsignorsPage() {
  const { setConfig } = useWorkspaceHeader();
  const fetchAuth = useAuthenticatedFetch();
  const { organization } = useOrganization();
  const [consignors, setConsignors] = useState<ConsignorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [contact, setContact] = useState("");

  useEffect(() => {
    setConfig({ hideHeader: true });
    return () => setConfig({});
  }, [setConfig]);

  const loadConsignors = async () => {
    setLoading(true);
    setError(null);
    try {
      setConsignors(await listConsignors(fetchAuth, organization?.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load consignors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConsignors();
  }, [organization?.id]);

  const canCreate = useMemo(
    () => displayName.trim().length > 0 && contact.trim().length > 0 && !saving,
    [displayName, contact, saving]
  );

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setSaving(true);
    setError(null);
    try {
      await createConsignorWithClerkUser(fetchAuth, {
        displayName,
        contact,
        organizationId: organization?.id,
      });
      setDisplayName("");
      setContact("");
      setShowCreate(false);
      await loadConsignors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create consignor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-zinc-900">{copy.consignorsPage.title}</h2>
            <button
              type="button"
              onClick={() => setShowCreate((s) => !s)}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              {showCreate ? "Cancel" : "New Consignor"}
            </button>
          </div>
          <p className="mt-2 text-sm text-zinc-500">{copy.consignorsPage.body}</p>

          {showCreate ? (
            <form
              onSubmit={onCreate}
              className="mt-5 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-zinc-900">Create consignor user</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Creates a Clerk user in your current org and then creates a consignor record.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-zinc-700">Name</span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Doe"
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-zinc-700">Contact (email or phone)</span>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="jane@example.com or +15551234567"
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                  />
                </label>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!canCreate}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create consignor"}
                </button>
                {organization?.name ? (
                  <span className="text-xs text-zinc-500">Org: {organization.name}</span>
                ) : (
                  <span className="text-xs text-rose-600">No org selected</span>
                )}
              </div>
            </form>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="grid grid-cols-3 border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span>Name</span>
              <span>Contact</span>
              <span>Created</span>
            </div>
            {loading ? (
              <div className="px-4 py-4 text-sm text-zinc-500">Loading consignors...</div>
            ) : consignors.length === 0 ? (
              <div className="px-4 py-4 text-sm text-zinc-500">No consignors yet.</div>
            ) : (
              consignors.map((consignor) => (
                <div
                  key={consignor.id}
                  className="grid grid-cols-3 items-center border-b border-zinc-100 px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="font-medium text-zinc-900">{consignor.display_name}</span>
                  <span className="text-zinc-600">
                    {consignor.email ?? consignor.phone_e164 ?? "-"}
                  </span>
                  <span className="text-zinc-500">
                    {new Date(consignor.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
            <Link
              to="/app/contracts"
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            >
              {copy.consignorsPage.nextContracts}
            </Link>
            <Link
              to="/app/products"
              className="text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 hover:decoration-zinc-500"
            >
              {copy.consignorsPage.productsLink}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
