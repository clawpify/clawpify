import { useEffect, useRef, useState } from "react";
import { useWorkspaceHeader } from "../../../context/WorkspaceHeaderContext";
import { ProductsProvider, useProducts } from "../context/ProductsContext";
import { copy } from "../../../utils/copy";
import { ProductsEmptyState } from "./ProductsEmptyState";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { ProductsTable } from "./ProductsTable";
import type { ConsignmentListingDto } from "../types";
import { suggestListingSku } from "../utils/suggestListingSku";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const formatUsd = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return usd.format(value);
};

const formatDurationMs = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
};

const sourceLabel = (url: string) => {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");
    const segments = parsed.pathname.split("/").filter(Boolean);
    const tail = segments.at(-1);
    if (!tail) return domain;
    const slug = decodeURIComponent(tail).replace(/[-_]+/g, " ").trim();
    if (!slug || slug.length < 3) return domain;
    return `${domain} • ${slug}`;
  } catch {
    return url;
  }
};

const normalizeSourceUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const hasScheme = /^https?:\/\//i.test(trimmed);
  const hasDot = trimmed.includes(".");
  const isLocalhost = /^localhost(?::\d+)?(?:\/|$)/i.test(trimmed);
  const isIp = /^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:\/|$)/.test(trimmed);
  if (!hasScheme && !hasDot && !isLocalhost && !isIp) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const canonicalSourceKey = (url: string) => {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.hostname.toLowerCase()}${path}`;
  } catch {
    return url.toLowerCase();
  }
};

const uniqueDisplaySources = (values?: string[]) => {
  const items = values ?? [];
  const seen = new Set<string>();
  const out: Array<{ raw: string; normalized: string }> = [];
  for (const raw of items) {
    const normalized = normalizeSourceUrl(raw);
    if (!normalized) continue;
    const key = canonicalSourceKey(normalized);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ raw, normalized });
  }
  return out;
};

const humanizeProcessItemError = (value?: string) => {
  const text = value?.trim();
  if (!text) return "Unknown error";
  const lower = text.toLowerCase();
  if (lower.includes("payload too large") || lower.includes("too large")) {
    return "Images are too large for upload. Remove some images, or retry with fewer/lower-resolution photos.";
  }
  return text;
};

const humanizeDraftClientId = (clientId: string, index: number) => {
  const match = /^draft-\d+-(\d+)$/.exec(clientId);
  const ordinal = match?.[1];
  if (ordinal) return `Draft ${Number.parseInt(ordinal, 10) + 1}`;
  return `Item ${index + 1}`;
};

const PRICING_PREVIEW_CHARS = 240;

const pricingPreview = (value: string) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= PRICING_PREVIEW_CHARS) return { short: normalized, hasMore: false };
  const cutoff = normalized.lastIndexOf(" ", PRICING_PREVIEW_CHARS);
  const safeIndex = cutoff > 140 ? cutoff : PRICING_PREVIEW_CHARS;
  return { short: `${normalized.slice(0, safeIndex).trimEnd()}...`, hasMore: true };
};

function ExpandableRationale({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = pricingPreview(text);
  return (
    <div className="mt-1">
      <p>{expanded ? text : preview.short}</p>
      {preview.hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 text-xs font-medium text-indigo-700 underline-offset-2 hover:underline"
        >
          {expanded ? "Show less" : "Show full rationale"}
        </button>
      ) : null}
    </div>
  );
}

function ProductsPageInner() {
  const {
    listings,
    loading,
    error,
    refetch,
    drafts,
    processing,
    processError,
    processResults,
    createDraft,
    addFilesToDraft,
    removeDraftImage,
    updateDraft,
    removeDraft,
    clearDrafts,
    processDrafts,
    updateListing,
    approveListing,
    deleteListing,
  } = useProducts();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const draftModelInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [targetDraftId, setTargetDraftId] = useState<string | null>(null);
  const [pendingScrollDraftId, setPendingScrollDraftId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<ConsignmentListingDto | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [savingListing, setSavingListing] = useState(false);
  const [approvingListing, setApprovingListing] = useState(false);
  const [deletingListing, setDeletingListing] = useState(false);
  const [aiResultsHidden, setAiResultsHidden] = useState(false);
  const [overviewHidden, setOverviewHidden] = useState(false);

  const onPickImages = (clientId: string) => {
    setTargetDraftId(clientId);
    fileInputRef.current?.click();
  };

  const onCreateProduct = () => {
    const clientId = createDraft();
    setPendingScrollDraftId(clientId);
  };

  useEffect(() => {
    if (!selectedListing) return;
    const refreshed = listings.find((item) => item.id === selectedListing.id);
    if (refreshed) setSelectedListing(refreshed);
  }, [listings, selectedListing]);

  useEffect(() => {
    if (processResults.length > 0) setAiResultsHidden(false);
  }, [processResults]);

  useEffect(() => {
    if (!pendingScrollDraftId) return;
    const card = draftCardRefs.current[pendingScrollDraftId];
    if (!card) return;

    card.scrollIntoView({ behavior: "smooth", block: "center" });
    window.requestAnimationFrame(() => {
      draftModelInputRefs.current[pendingScrollDraftId]?.focus();
    });
    setPendingScrollDraftId(null);
  }, [drafts, pendingScrollDraftId]);

  const onCloseModal = () => {
    setSelectedListing(null);
    setModalError(null);
  };

  const onSaveListing = async (payload: {
    title: string;
    sku: string;
    status: string;
    vendor: string;
    productType: string;
    tags: string[];
    priceDollars: string;
    descriptionHtml: string;
  }) => {
    if (!selectedListing) return;
    const price = Number.parseFloat(payload.priceDollars);
    if (!Number.isFinite(price) || price < 0) {
      setModalError("Price must be a valid positive number.");
      return;
    }
    setSavingListing(true);
    setModalError(null);
    try {
      await updateListing(selectedListing.id, {
        title: payload.title.trim(),
        sku:
          payload.sku.trim() ||
          suggestListingSku(payload.vendor, payload.title, selectedListing.id),
        status: payload.status.trim() || "draft",
        vendor: payload.vendor.trim(),
        product_type: payload.productType.trim(),
        tags: payload.tags,
        price_cents: Math.round(price * 100),
        description_html: payload.descriptionHtml,
      });
      await refetch();
      onCloseModal();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Failed to save listing");
    } finally {
      setSavingListing(false);
    }
  };

  const onApproveListing = async () => {
    if (!selectedListing) return;
    setApprovingListing(true);
    setModalError(null);
    try {
      await approveListing(selectedListing.id);
      await refetch();
      onCloseModal();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Failed to approve listing");
    } finally {
      setApprovingListing(false);
    }
  };

  const onDeleteListing = async () => {
    if (!selectedListing) return;
    const confirmed = window.confirm(
      `Delete "${selectedListing.title || "this listing"}"? This cannot be undone.`
    );
    if (!confirmed) return;
    setDeletingListing(true);
    setModalError(null);
    try {
      await deleteListing(selectedListing.id);
      onCloseModal();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Failed to delete listing");
    } finally {
      setDeletingListing(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="flex-1 overflow-auto px-3 py-4 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">{copy.products.title}</h2>
            <p className="mt-2 text-sm text-zinc-500">{copy.products.subtitle}</p>
          </div>

          {listings.length === 0 && !overviewHidden ? (
            <ProductsEmptyState className="mt-5" onClose={() => setOverviewHidden(true)} />
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={onCreateProduct}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 sm:order-last sm:w-auto sm:py-1.5"
            >
              New product
            </button>
            {error ? (
              <button
                type="button"
                onClick={() => void refetch()}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 sm:w-auto sm:py-1.5"
              >
                {copy.products.retry}
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && targetDraftId) {
                await Promise.resolve(addFilesToDraft(targetDraftId, e.target.files));
                setTargetDraftId(null);
                e.currentTarget.value = "";
              }
            }}
          />

          <section className="mt-5 rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-zinc-900">AI Intake</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Add products one at a time, upload multiple images for each, then process in parallel.
            </p>
            {drafts.length > 0 ? (
              <div className="mt-4 space-y-3">
                {drafts.map((draft, index) => (
                  <div
                    key={draft.clientId}
                    ref={(el) => {
                      draftCardRefs.current[draft.clientId] = el;
                    }}
                    className="rounded-lg border border-zinc-200 p-2.5 sm:p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-zinc-900">Product {index + 1}</p>
                      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                        <button
                          type="button"
                          onClick={() => onPickImages(draft.clientId)}
                          className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 sm:flex-none"
                        >
                          Add images
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDraft(draft.clientId)}
                          className="order-last w-full rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 sm:order-none sm:w-auto sm:py-1"
                          aria-label={`Remove product ${index + 1}`}
                          title="Remove product"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {draft.images.length > 0 ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                        {draft.images.map((image) => (
                          <div key={image.imageId} className="relative overflow-hidden rounded-md">
                            <img
                              src={image.previewUrl}
                              alt={`Product ${index + 1}`}
                              className="h-24 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeDraftImage(draft.clientId, image.imageId)}
                              className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-amber-700">Add at least one image.</p>
                    )}
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        ref={(el) => {
                          draftModelInputRefs.current[draft.clientId] = el;
                        }}
                        placeholder="Model"
                        value={draft.model}
                        onChange={(e) => updateDraft(draft.clientId, { model: e.target.value })}
                        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                      />
                      <input
                        placeholder="Original price (USD)"
                        value={draft.originalPrice}
                        onChange={(e) =>
                          updateDraft(draft.clientId, { originalPrice: e.target.value })
                        }
                        className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                      />
                      <label className="flex items-center gap-2 text-sm text-zinc-700">
                        <input
                          type="checkbox"
                          checked={draft.isUsed}
                          onChange={(e) =>
                            updateDraft(draft.clientId, { isUsed: e.target.checked })
                          }
                        />
                        Item is used
                      </label>
                      <div className="text-xs text-zinc-500 self-center">
                        {draft.images.length} image{draft.images.length === 1 ? "" : "s"} attached
                      </div>
                      <textarea
                        placeholder="Notes / product details"
                        value={draft.notes}
                        onChange={(e) => updateDraft(draft.clientId, { notes: e.target.value })}
                        rows={2}
                        className="md:col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No products yet. Click New product to get started.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                disabled={processing || drafts.length === 0}
                onClick={() => void processDrafts()}
                className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 sm:w-auto sm:py-1.5"
              >
                {processing ? "Processing..." : `Process ${drafts.length} item(s)`}
              </button>
              <button
                type="button"
                onClick={clearDrafts}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm sm:w-auto sm:py-1.5"
              >
                Clear
              </button>
            </div>
            {processError ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {processError}
              </p>
            ) : null}
          </section>

          {processResults.length > 0 && !aiResultsHidden ? (
            <section className="mt-5 rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-900">AI Results</h3>
                <button
                  type="button"
                  onClick={() => setAiResultsHidden(true)}
                  className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                >
                  Hide
                </button>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {processResults.map((result, index) => (
                  <div
                    key={result.clientId}
                    className="rounded-lg border border-zinc-200 p-3"
                  >
                    <p className="font-medium text-zinc-900">
                      {result.status === "created" ? "Created" : "Failed"} -{" "}
                      {humanizeDraftClientId(result.clientId, index)}
                    </p>
                    {result.status === "created" ? (
                      <>
                        {formatDurationMs(result.parsed?.durationMs) ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            AI processing time: {formatDurationMs(result.parsed?.durationMs)}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                            Suggested {formatUsd(result.parsed?.suggestedPrice)}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">
                            Cash buy {formatUsd(result.parsed?.consignorCashBuyPrice)}
                          </span>
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-800">
                            Range {formatUsd(result.parsed?.consignmentRangeLow)} -{" "}
                            {formatUsd(result.parsed?.consignmentRangeHigh)}
                          </span>
                        </div>
                        {result.parsed?.itemDescriptionChips?.length ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              Item details
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                              {result.parsed.itemDescriptionChips.map((chip) => (
                                <span
                                  key={chip}
                                  className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700"
                                >
                                  {chip}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        <p className="mt-3 text-sm text-zinc-700">
                          {result.parsed?.suggestedDescription || "No short description returned."}
                        </p>
                        {result.parsed?.brandDescription ? (
                          <p className="mt-2 text-sm text-zinc-700">
                            {result.parsed.brandDescription}
                          </p>
                        ) : null}
                        {result.parsed?.pricingReasoning ? (
                          <div className="mt-3 rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                              Pricing rationale
                            </p>
                            <ExpandableRationale text={result.parsed.pricingReasoning} />
                          </div>
                        ) : null}
                        {result.parsed?.pricingChips?.length ? (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              Price drivers
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                              {result.parsed.pricingChips.map((chip) => (
                                <span
                                  key={chip}
                                  className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-800"
                                >
                                  {chip}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Sources
                          </p>
                          {uniqueDisplaySources(result.parsed?.sourcesSearched).length ? (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-800">
                                Show sources ({uniqueDisplaySources(result.parsed?.sourcesSearched).length})
                              </summary>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {uniqueDisplaySources(result.parsed?.sourcesSearched).map(
                                  ({ raw, normalized }) => (
                                    <a
                                      key={`${raw}-all`}
                                      href={normalized}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex max-w-full items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                                      title={normalized}
                                    >
                                      <span className="truncate">{sourceLabel(normalized)}</span>
                                      <span aria-hidden="true" className="text-zinc-400">
                                        ↗
                                      </span>
                                    </a>
                                  )
                                )}
                              </div>
                            </details>
                          ) : (
                            <p className="mt-1 text-xs text-zinc-500">No sources returned.</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-red-600">{humanizeProcessItemError(result.error)}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {loading ? (
            <p className="mt-8 text-sm text-zinc-500">{copy.products.loading}</p>
          ) : error ? (
            <p className="mt-8 text-sm text-red-600" role="alert">
              {copy.products.loadErrorPrefix} {error}
            </p>
          ) : listings.length === 0 ? (
            <p className="mt-8 text-sm text-zinc-500">No listings yet.</p>
          ) : (
            <ProductsTable listings={listings} onSelectListing={setSelectedListing} />
          )}
        </div>
      </div>
      {selectedListing ? (
        <ProductDetailsModal
          open
          listing={selectedListing}
          saving={savingListing}
          approving={approvingListing}
          deleting={deletingListing}
          error={modalError}
          onClose={onCloseModal}
          onSave={onSaveListing}
          onApprove={onApproveListing}
          onDelete={onDeleteListing}
        />
      ) : null}
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
