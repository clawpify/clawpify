import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useToast } from "../../../../../lib/toast";
import { copy } from "../../../utils/copy";
import { useProducts } from "../context/ProductsContext";
import type { ConsignmentListingDto } from "../types";
import { htmlToMarkdown, markdownToSafeHtml } from "../utils/listingMarkdown";
import { buildListingTimelineEvents } from "../utils/buildListingTimelineEvents";
import {
  centsToPriceInputString,
  formatListingPrice,
  parsePriceInputToCents,
} from "../utils/formatListingPrice";
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

function DetailRailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-zinc-200/80 bg-white ${RAIL_CARD_SHADOW}`}
    >
      <h3 className="border-b border-zinc-200/80 px-2 py-2 text-[13px] font-medium text-zinc-600">
        {title}
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
  const [tagsDraft, setTagsDraft] = useState<string[]>(() => [...(listing.tags ?? [])]);
  const [lastSavedTags, setLastSavedTags] = useState<string[]>(() => [...(listing.tags ?? [])]);
  const [lastSavedPriceCents, setLastSavedPriceCents] = useState(listing.price_cents);
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const categoryEscapeRef = useRef(false);
  const [priceDraft, setPriceDraft] = useState(() => centsToPriceInputString(listing.price_cents));
  const [skuDraft, setSkuDraft] = useState(() => listing.sku ?? "");
  const [lastSavedSku, setLastSavedSku] = useState(() => listing.sku ?? "");

  useEffect(() => {
    const md = htmlToMarkdown(listing.description_html ?? "");
    setTitleDraft(listing.title);
    setMdDraft(md);
    setLastSavedTitle(listing.title);
    setLastSavedMarkdown(md);
    setLastSavedPriceCents(listing.price_cents);
    setPriceDraft(centsToPriceInputString(listing.price_cents));
    const nextTags = [...(listing.tags ?? [])];
    setTagsDraft(nextTags);
    setLastSavedTags(nextTags);
    const nextSku = listing.sku ?? "";
    setSkuDraft(nextSku);
    setLastSavedSku(nextSku);
  }, [listing.id]);

  useEffect(() => {
    if (addingCategory) {
      categoryInputRef.current?.focus();
    }
  }, [addingCategory]);

  useEffect(() => () => setActionToast(null), [setActionToast]);

  const closeCategoryInput = useCallback(() => {
    setAddingCategory(false);
    setCategoryInput("");
  }, []);

  const submitCategory = useCallback(() => {
    const t = categoryInput.trim();
    if (!t) {
      closeCategoryInput();
      return;
    }
    const lower = t.toLowerCase();
    let duplicate = false;
    setTagsDraft((prev) => {
      if (prev.some((tag) => tag.toLowerCase() === lower)) {
        duplicate = true;
        return prev;
      }
      return [...prev, t];
    });
    if (duplicate) showToast(copy.products.detailCategoryDuplicate);
    closeCategoryInput();
  }, [categoryInput, closeCategoryInput, showToast]);

  const savedPriceStr = centsToPriceInputString(lastSavedPriceCents);
  const parsedPriceDraft = parsePriceInputToCents(priceDraft);
  const priceDraftIsDirty =
    priceDraft.trim() !== savedPriceStr &&
    (parsedPriceDraft === null || parsedPriceDraft !== lastSavedPriceCents);
  const tagsDraftIsDirty =
    tagsDraft.length !== lastSavedTags.length || tagsDraft.some((t, i) => t !== lastSavedTags[i]);
  const skuDraftIsDirty = skuDraft.trim() !== lastSavedSku.trim();

  const hasUnsavedEdits =
    titleDraft.trim() !== lastSavedTitle.trim() ||
    mdDraft !== lastSavedMarkdown ||
    priceDraftIsDirty ||
    tagsDraftIsDirty ||
    skuDraftIsDirty;

  const priceBlocksPublish = priceDraftIsDirty && parsedPriceDraft === null;

  const onCancelEdits = useCallback(() => {
    setTitleDraft(lastSavedTitle);
    setMdDraft(lastSavedMarkdown);
    setPriceDraft(centsToPriceInputString(lastSavedPriceCents));
    setTagsDraft([...lastSavedTags]);
    setSkuDraft(lastSavedSku);
    closeCategoryInput();
    setCategoryInput("");
  }, [
    lastSavedTitle,
    lastSavedMarkdown,
    lastSavedPriceCents,
    lastSavedTags,
    lastSavedSku,
    closeCategoryInput,
  ]);

  const onSaveEdits = useCallback(async () => {
    const cents = parsePriceInputToCents(priceDraft);
    if (cents === null) {
      showToast(copy.products.detailPriceInvalid);
      return;
    }
    try {
      const updated = await updateListing(listing.id, {
        title: titleDraft.trim(),
        description_html: markdownToSafeHtml(mdDraft),
        price_cents: cents,
        tags: tagsDraft,
        sku: skuDraft.trim(),
      });
      const md = htmlToMarkdown(updated.description_html ?? "");
      setTitleDraft(updated.title);
      setMdDraft(md);
      setLastSavedTitle(updated.title);
      setLastSavedMarkdown(md);
      setLastSavedPriceCents(updated.price_cents);
      setPriceDraft(centsToPriceInputString(updated.price_cents));
      const savedTags = [...(updated.tags ?? [])];
      setTagsDraft(savedTags);
      setLastSavedTags(savedTags);
      const nextSku = updated.sku ?? "";
      setSkuDraft(nextSku);
      setLastSavedSku(nextSku);
      showToast(copy.products.detailListingSaved);
    } catch (e) {
      showToast(
        `${copy.products.detailListingSaveFailed} ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }
  }, [updateListing, listing.id, titleDraft, mdDraft, priceDraft, tagsDraft, skuDraft, showToast]);

  const saveDisabled = updatingListing || !hasUnsavedEdits || priceBlocksPublish;

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
            className="h-[13.5rem] w-full resize-none overflow-y-auto border-0 bg-transparent px-0 py-2 text-base leading-[1.65] text-zinc-600 shadow-none outline-none ring-0 transition placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0"
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
              <input
                type="text"
                inputMode="decimal"
                value={priceDraft}
                onChange={(e) => setPriceDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                disabled={updatingListing}
                aria-label={copy.products.detailSidebarPrice}
                title={formatListingPrice(lastSavedPriceCents, listing.currency_code)}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-[13px] font-medium tabular-nums leading-snug text-zinc-900 shadow-none outline-none ring-0 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50"
                autoComplete="off"
              />
            </PropertyRow>
            <PropertyRow label={copy.products.detailSidebarSku}>
              <input
                type="text"
                value={skuDraft}
                onChange={(e) => setSkuDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                disabled={updatingListing}
                aria-label={copy.products.detailSidebarSku}
                placeholder={copy.products.createModalSkuPlaceholder}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-[13px] font-medium leading-snug text-zinc-900 shadow-none outline-none ring-0 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50"
                autoComplete="off"
              />
            </PropertyRow>
          </div>
        </DetailRailCard>

        <DetailRailCard title={copy.products.detailSidebarLabels}>
          <div className="flex flex-wrap items-center gap-1.5 px-2 py-2">
            {tagsDraft.length === 0 && !addingCategory ? (
              <span className="text-[13px] text-zinc-400">{copy.products.detailLabelsEmpty}</span>
            ) : (
              tagsDraft.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-zinc-200/90 bg-zinc-50/90 px-2 py-0.5 text-[12px] font-medium text-zinc-700"
                >
                  <span className={`size-1.5 shrink-0 rounded-full ${tagDotClass(tag)}`} aria-hidden />
                  <span className="min-w-0 truncate">{tag}</span>
                </span>
              ))
            )}
            {addingCategory ? (
              <input
                ref={categoryInputRef}
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitCategory();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    categoryEscapeRef.current = true;
                    closeCategoryInput();
                  }
                }}
                onBlur={() => {
                  queueMicrotask(() => {
                    if (categoryEscapeRef.current) {
                      categoryEscapeRef.current = false;
                      return;
                    }
                    submitCategory();
                  });
                }}
                disabled={updatingListing}
                placeholder={copy.products.createModalCategoryPlaceholder}
                aria-label={copy.products.detailAddLabelAria}
                className="h-6 min-w-[6rem] max-w-[12rem] flex-1 rounded-md border border-zinc-200/90 bg-white px-2 text-[12px] text-zinc-900 shadow-none outline-none ring-0 placeholder:text-zinc-400 focus-visible:border-zinc-300 focus-visible:ring-1 focus-visible:ring-zinc-200"
                autoComplete="off"
              />
            ) : null}
            <button
              type="button"
              aria-label={copy.products.detailAddLabelAria}
              disabled={updatingListing || addingCategory}
              onClick={() => setAddingCategory(true)}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:pointer-events-none disabled:opacity-40"
            >
              <PlusIcon size={16} className="text-current" />
            </button>
          </div>
        </DetailRailCard>
      </aside>
    </div>
  );
}
