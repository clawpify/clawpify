import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useToast } from "../../../../../lib/toast";
import { copy } from "../../../utils/copy";
import { useProducts } from "../context/ProductsContext";
import type { ConsignmentListingDto } from "../types";
import { htmlToMarkdown, markdownToSafeHtml } from "../utils/listingMarkdown";
import { buildListingTimelineEvents } from "../utils/buildListingTimelineEvents";
import { formatListingPrice } from "../utils/formatListingPrice";
import { statusDotClass } from "../utils/productStatusTab";
import { PlusIcon } from "../../../../../icons/workspace-icons";
import { ListingMediaSection } from "./listing-media";
import { RAIL_CARD_SHADOW } from "./listing-media/listingMediaChrome";

type Props = {
  listing: ConsignmentListingDto;
};

const TAG_DOT_CLASSES = [
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
] as const;

function tagDotClass(tag: string): string {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h + tag.charCodeAt(i) * (i + 1)) % 1000;
  return TAG_DOT_CLASSES[h % TAG_DOT_CLASSES.length] ?? "bg-zinc-400";
}

function vendorLabel(listing: ConsignmentListingDto): string {
  const v = listing.vendor?.trim();
  return v || copy.products.detailNone;
}

function skuLabel(listing: ConsignmentListingDto): string {
  const s = listing.sku?.trim();
  return s || copy.products.detailNone;
}

function PropertyRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-start gap-x-2 border-b border-zinc-100/80 py-1.5 last:border-b-0">
      <div className="pt-px text-[12px] font-medium text-zinc-500">{label}</div>
      <div className="min-w-0 text-[13px] leading-snug text-zinc-900">{children}</div>
    </div>
  );
}

function ListingStatusInline({ status }: { status: string }) {
  const text = status.replaceAll("_", " ");
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 capitalize">
      <span className={`size-2 shrink-0 rounded-full ${statusDotClass(status)}`} aria-hidden />
      <span>{text}</span>
    </span>
  );
}

function RailSectionCaret({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="currentColor"
      aria-hidden
    >
      <path d="M0 0.5L5 5.5L10 0.5H0Z" />
    </svg>
  );
}

function DetailRailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-zinc-200/80 bg-white ${RAIL_CARD_SHADOW}`}
    >
      <h3 className="flex items-center gap-0.5 border-b border-zinc-200/80 px-2 py-2 text-[13px] font-medium text-zinc-600">
        <span>{title}</span>
        <RailSectionCaret className="mt-px shrink-0 text-zinc-400 opacity-70" />
      </h3>
      {children}
    </div>
  );
}

export function ProductsListingDetail({ listing }: Props) {
  const { updateListing, updatingListing } = useProducts();
  const { showToast, setActionToast } = useToast();
  const [titleDraft, setTitleDraft] = useState(listing.title);
  const [mdDraft, setMdDraft] = useState(() => htmlToMarkdown(listing.description_html ?? ""));
  const [lastSavedTitle, setLastSavedTitle] = useState(listing.title);
  const [lastSavedMarkdown, setLastSavedMarkdown] = useState(() =>
    htmlToMarkdown(listing.description_html ?? "")
  );
  const timeline = useMemo(() => buildListingTimelineEvents(listing), [listing]);
  const tags = listing.tags ?? [];

  useEffect(() => {
    const md = htmlToMarkdown(listing.description_html ?? "");
    setTitleDraft(listing.title);
    setMdDraft(md);
    setLastSavedTitle(listing.title);
    setLastSavedMarkdown(md);
  }, [listing.id]);

  useEffect(() => () => setActionToast(null), [setActionToast]);

  const hasUnsavedEdits =
    titleDraft.trim() !== lastSavedTitle.trim() || mdDraft !== lastSavedMarkdown;

  const onCancelEdits = useCallback(() => {
    setTitleDraft(lastSavedTitle);
    setMdDraft(lastSavedMarkdown);
  }, [lastSavedTitle, lastSavedMarkdown]);

  const onSaveEdits = useCallback(async () => {
    try {
      const updated = await updateListing(listing.id, {
        title: titleDraft.trim(),
        description_html: markdownToSafeHtml(mdDraft),
      });
      const md = htmlToMarkdown(updated.description_html ?? "");
      setTitleDraft(updated.title);
      setMdDraft(md);
      setLastSavedTitle(updated.title);
      setLastSavedMarkdown(md);
      showToast(copy.products.detailListingSaved);
    } catch (e) {
      showToast(
        `${copy.products.detailListingSaveFailed} ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }
  }, [updateListing, listing.id, titleDraft, mdDraft, showToast]);

  const saveDisabled = updatingListing || !hasUnsavedEdits;

  useEffect(() => {
    if (!hasUnsavedEdits) {
      setActionToast(null);
      return;
    }
    setActionToast({
      message: copy.products.detailUnsavedChangesBar,
      primaryLabel: copy.products.detailDescriptionSave,
      secondaryLabel: copy.products.detailDescriptionCancel,
      ariaLabel: copy.products.detailUnsavedChangesAria,
      onPrimary: () => void onSaveEdits(),
      onSecondary: onCancelEdits,
      primaryDisabled: saveDisabled,
      secondaryDisabled: updatingListing,
    });
  }, [
    hasUnsavedEdits,
    setActionToast,
    onSaveEdits,
    onCancelEdits,
    saveDisabled,
    updatingListing,
  ]);

  return (
    <div className="flex min-h-0 flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-6 lg:pl-0">
      <div className="min-w-0">
        <section aria-label={copy.products.detailSectionMedia}>
          <ListingMediaSection listing={listing} />
        </section>

        <div className="mt-7 flex flex-col gap-1">
          <label className="sr-only" htmlFor="listing-detail-title">
            {copy.products.createModalTitlePlaceholder}
          </label>
          <input
            id="listing-detail-title"
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            className="w-full border-0 bg-transparent p-0 text-2xl font-bold tracking-tight text-zinc-900 shadow-none outline-none ring-0 transition placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0"
            placeholder={copy.products.createModalTitlePlaceholder}
            autoComplete="off"
          />
        </div>

        <section className="mt-7" aria-label={copy.products.detailSectionDescription}>
          <textarea
            value={mdDraft}
            onChange={(e) => setMdDraft(e.target.value)}
            rows={8}
            className="w-full min-h-[10rem] resize-y border-0 bg-transparent px-0 py-2 text-base leading-[1.65] text-zinc-600 shadow-none outline-none ring-0 transition placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0"
            placeholder={copy.products.createModalDescriptionPlaceholder}
            aria-label={copy.products.createModalDescriptionPlaceholder}
          />
        </section>

        <section className="mt-14 border-t border-zinc-100 pt-8" aria-label={copy.products.detailSectionActivity}>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400">
            {copy.products.detailSectionActivity}
          </h2>
          <ul className="mt-4" role="list">
            {timeline.map((ev, i) => {
              const isLast = i === timeline.length - 1;
              return (
                <li key={ev.id} className="flex gap-3 pb-5 last:pb-0">
                  <div className="relative flex w-[18px] shrink-0 justify-center self-stretch">
                    {!isLast ? (
                      <span
                        className="absolute left-1/2 top-[11px] -bottom-5 w-px -translate-x-1/2 bg-zinc-200"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className="relative z-[1] mt-px size-2 shrink-0 rounded-full border-2 border-white bg-zinc-400 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
                      aria-hidden
                    />
                  </div>
                  <p className="min-w-0 flex-1 pt-px text-[13px] leading-snug text-zinc-700">{ev.body}</p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <aside className="flex min-w-0 flex-col gap-3" aria-label={copy.products.detailSidebarRailAria}>
        <DetailRailCard title={copy.products.detailSidebarHeading}>
          <div className="px-2 pb-1.5 pt-0.5">
            <PropertyRow label={copy.products.detailSidebarStatus}>
              <ListingStatusInline status={listing.status} />
            </PropertyRow>
            <PropertyRow label={copy.products.detailSidebarPrice}>
              <span className="tabular-nums font-medium">
                {formatListingPrice(listing.price_cents, listing.currency_code)}
              </span>
            </PropertyRow>
            <PropertyRow label={copy.products.detailSidebarSku}>{skuLabel(listing)}</PropertyRow>
            <PropertyRow label={copy.products.detailSidebarVendor}>{vendorLabel(listing)}</PropertyRow>
            <PropertyRow label={copy.products.detailSidebarChannels}>
              <span className="text-zinc-500">{copy.products.detailNone}</span>
            </PropertyRow>
          </div>
        </DetailRailCard>

        <DetailRailCard title={copy.products.detailSidebarLabels}>
          <div className="flex flex-wrap items-center gap-1.5 px-2 py-2">
            {tags.length === 0 ? (
              <span className="text-[13px] text-zinc-400">{copy.products.detailLabelsEmpty}</span>
            ) : (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-zinc-200/90 bg-zinc-50/90 px-2 py-0.5 text-[12px] font-medium text-zinc-700"
                >
                  <span className={`size-1.5 shrink-0 rounded-full ${tagDotClass(tag)}`} aria-hidden />
                  <span className="min-w-0 truncate">{tag}</span>
                </span>
              ))
            )}
            <button
              type="button"
              aria-label={copy.products.detailAddLabelAria}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            >
              <PlusIcon size={16} className="text-current" />
            </button>
          </div>
        </DetailRailCard>
      </aside>
    </div>
  );
}
