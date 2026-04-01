import { useEffect, useMemo, useState } from "react";
import type { ConsignmentListingDto } from "../types";
import { suggestListingSku } from "../utils/suggestListingSku";

type ProductDetailsModalProps = {
  listing: ConsignmentListingDto;
  open: boolean;
  saving: boolean;
  approving: boolean;
  deleting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    sku: string;
    status: string;
    vendor: string;
    productType: string;
    tags: string[];
    priceDollars: string;
    descriptionHtml: string;
  }) => Promise<void>;
  onApprove: () => Promise<void>;
  onDelete: () => Promise<void>;
};

type FormState = {
  title: string;
  sku: string;
  status: string;
  vendor: string;
  productType: string;
  tags: string;
  priceDollars: string;
  descriptionHtml: string;
};

type AiSummary = {
  suggestedPrice?: number;
  floorPrice?: number;
  consignorCashBuyPrice?: number;
  consignmentRangeLow?: number;
  consignmentRangeHigh?: number;
  brandDescription?: string;
  pricingReasoning?: string;
  itemDescriptionChips: string[];
  pricingChips: string[];
  sourcesSearched: string[];
};

function centsToDollars(value: number): string {
  return (value / 100).toFixed(2);
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function formatUsd(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return usd.format(value);
}

function sourceLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toNumberDollars(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value / 100;
  return undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function getAiSummary(listing: ConsignmentListingDto): AiSummary | null {
  const attrs = toRecord(listing.ai_attributes);
  if (!attrs) return null;
  return {
    suggestedPrice: toNumberDollars(attrs.suggestedPriceCents),
    floorPrice: toNumberDollars(attrs.floorPriceCents),
    consignorCashBuyPrice: toNumberDollars(attrs.consignorCashBuyPriceCents),
    consignmentRangeLow: toNumberDollars(attrs.consignmentRangeLowCents),
    consignmentRangeHigh: toNumberDollars(attrs.consignmentRangeHighCents),
    brandDescription:
      typeof attrs.brandDescription === "string" ? attrs.brandDescription : undefined,
    pricingReasoning:
      typeof attrs.pricingReasoning === "string" ? attrs.pricingReasoning : undefined,
    itemDescriptionChips: toStringArray(attrs.itemDescriptionChips),
    pricingChips: toStringArray(attrs.pricingChips),
    sourcesSearched: toStringArray(attrs.sourcesSearched),
  };
}

function toFormState(listing: ConsignmentListingDto): FormState {
  const suggestedSku = suggestListingSku(listing.vendor ?? "", listing.title ?? "", listing.id);
  return {
    title: listing.title ?? "",
    sku: listing.sku?.trim() || suggestedSku,
    status: listing.status ?? "",
    vendor: listing.vendor ?? "",
    productType: listing.product_type ?? "",
    tags: (listing.tags ?? []).join(", "),
    priceDollars: centsToDollars(listing.price_cents ?? 0),
    descriptionHtml: listing.description_html ?? "",
  };
}

export function ProductDetailsModal({
  listing,
  open,
  saving,
  approving,
  deleting,
  error,
  onClose,
  onSave,
  onApprove,
  onDelete,
}: ProductDetailsModalProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(listing));
  const [skuTouched, setSkuTouched] = useState(false);
  const busy = saving || approving || deleting;
  const aiSummary = useMemo(() => getAiSummary(listing), [listing]);

  useEffect(() => {
    setForm(toFormState(listing));
    setSkuTouched(false);
  }, [listing]);

  useEffect(() => {
    if (skuTouched) return;
    const nextSku = suggestListingSku(form.vendor, form.title, listing.id);
    setForm((prev) => (prev.sku === nextSku ? prev : { ...prev, sku: nextSku }));
  }, [form.vendor, form.title, listing.id, skuTouched]);

  const title = useMemo(() => form.title.trim() || "Untitled product", [form.title]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Edit product"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
            <p className="mt-1 text-xs text-zinc-500">Listing ID: {listing.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onApprove()}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {approving ? "Approving..." : "Approve"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onDelete()}
              className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            Title
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-700">
            SKU
            <input
              value={form.sku}
              onChange={(e) => {
                setSkuTouched(true);
                setForm((prev) => ({ ...prev, sku: e.target.value }));
              }}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-700">
            Status
            <input
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-700">
            Price (USD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.priceDollars}
              onChange={(e) => setForm((prev) => ({ ...prev, priceDollars: e.target.value }))}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-700">
            Vendor
            <input
              value={form.vendor}
              onChange={(e) => setForm((prev) => ({ ...prev, vendor: e.target.value }))}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-700">
            Product type
            <input
              value={form.productType}
              onChange={(e) => setForm((prev) => ({ ...prev, productType: e.target.value }))}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            Tags (comma separated)
            <input
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            Description
            <textarea
              rows={6}
              value={form.descriptionHtml}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, descriptionHtml: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          </div>

          {aiSummary ? (
            <div className="mt-4 border-t border-zinc-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">AI Summary</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-800">
                Floor {formatUsd(aiSummary.floorPrice)}
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">
                Cash buy {formatUsd(aiSummary.consignorCashBuyPrice)}
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-800">
                Range {formatUsd(aiSummary.consignmentRangeLow)} -{" "}
                {formatUsd(aiSummary.consignmentRangeHigh)}
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                Suggested {formatUsd(aiSummary.suggestedPrice)}
              </span>
            </div>
            {aiSummary.itemDescriptionChips.length ? (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Item details
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {aiSummary.itemDescriptionChips.map((chip) => (
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
            {aiSummary.brandDescription ? (
              <p className="mt-3 text-sm text-zinc-700">{aiSummary.brandDescription}</p>
            ) : null}
            {aiSummary.pricingReasoning ? (
              <div className="mt-3 rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Pricing rationale
                </p>
                <p className="mt-1">{aiSummary.pricingReasoning}</p>
              </div>
            ) : null}
            {aiSummary.pricingChips.length ? (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Price drivers
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {aiSummary.pricingChips.map((chip) => (
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
            {aiSummary.sourcesSearched.length ? (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Sources</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {aiSummary.sourcesSearched.map((source) => (
                    <a
                      key={source}
                      href={source}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                      title={source}
                    >
                      <span className="truncate">{sourceLabel(source)}</span>
                      <span aria-hidden="true" className="text-zinc-400">
                        ↗
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
            </div>
          ) : null}
        </div>

        {error ? <p className="px-5 pb-2 text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void onSave({
                title: form.title,
                sku: form.sku,
                status: form.status,
                vendor: form.vendor,
                productType: form.productType,
                tags: form.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
                priceDollars: form.priceDollars,
                descriptionHtml: form.descriptionHtml,
              })
            }
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
