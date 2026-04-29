import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useToast } from "../../../../../lib/toast";
import { copy } from "../../../utils/copy";
import { useProducts } from "../context/ProductsContext";
import type { ConsignmentListingDto } from "../types";
import {
  buildListingTimelineEvents,
  centsToPriceInputString,
  formatListingPrice,
  parsePriceInputToCents,
  statusDotClass,
} from "../utils/generalFns";
import { PlusIcon } from "../../../../../icons/workspace-icons";
import { ListingMediaSection } from "./listing-media";
import { ProductsListingIntegration } from "./ProductsListingIntegration";
import { RAIL_CARD_SHADOW } from "./listing-media/listingMediaChrome";

type Props = {
  listing: ConsignmentListingDto;
};

type ListingMetadataForm = {
  sku: string;
  priceDollars: string;
};

const TAG_DOT_CLASSES = [
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
] as const;

const EDITABLE_RAIL_INPUT_CLASS =
  "w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[13px] text-zinc-900 outline-none transition hover:border-zinc-200 hover:bg-white focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-200 disabled:opacity-60";

function toMetadataForm(listing: ConsignmentListingDto): ListingMetadataForm {
  return {
    sku: listing.sku ?? "",
    priceDollars: centsToPriceInputString(listing.price_cents ?? 0),
  };
}

function isMetadataDirty(listing: ConsignmentListingDto, form: ListingMetadataForm): boolean {
  const originalSku = (listing.sku ?? "").trim();
  const originalPriceCents = listing.price_cents ?? 0;
  const parsedPriceCents = parsePriceInputToCents(form.priceDollars);

  if (form.sku.trim() !== originalSku) return true;
  if (parsedPriceCents !== null) return parsedPriceCents !== originalPriceCents;

  return form.priceDollars.trim() !== centsToPriceInputString(originalPriceCents);
}

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

function DetailRailCard({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const chrome = `overflow-hidden rounded-lg border border-zinc-200/80 bg-white ${RAIL_CARD_SHADOW}`;
  const headingClass =
    "flex w-full items-center gap-0.5 border-b border-zinc-200/80 px-2 py-2 text-left text-[13px] font-medium text-zinc-600";

  if (collapsible) {
    return (
      <details className={`${chrome} group`} open={defaultOpen}>
        <summary className={`${headingClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
          <span>{title}</span>
          <RailSectionCaret className="mt-px shrink-0 text-zinc-400 opacity-70 transition group-open:rotate-180" />
        </summary>
        {children}
      </details>
    );
  }

  return (
    <div className={chrome}>
      <h3 className={headingClass}>
        <span>{title}</span>
        <RailSectionCaret className="mt-px shrink-0 text-zinc-400 opacity-70" />
      </h3>
      {children}
    </div>
  );
}

export function ProductsListingDetail({ listing }: Props) {
  const timeline = useMemo(() => buildListingTimelineEvents(listing), [listing]);
  const tags = listing.tags ?? [];
  const { updateListing, updatingListing } = useProducts();
  const { showToast, setActionToast } = useToast();
  const [metadataForm, setMetadataForm] = useState(() => toMetadataForm(listing));
  const hasUnsavedChanges = isMetadataDirty(listing, metadataForm);

  useEffect(() => {
    setMetadataForm(toMetadataForm(listing));
  }, [listing.id, listing.sku, listing.price_cents]);

  useEffect(() => () => setActionToast(null), [setActionToast]);

  const resetFields = useCallback(() => {
    setMetadataForm(toMetadataForm(listing));
    setActionToast(null);
  }, [listing, setActionToast]);

  const saveFields = useCallback(async () => {
    const nextPriceCents = parsePriceInputToCents(metadataForm.priceDollars);
    if (nextPriceCents === null) {
      showToast(copy.products.detailPriceInvalid);
      return;
    }

    try {
      await updateListing(listing.id, {
        sku: metadataForm.sku.trim(),
        price_cents: nextPriceCents,
      });
      setActionToast(null);
      showToast("Listing saved.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      showToast(`Could not save listing: ${msg}`);
    }
  }, [listing.id, metadataForm, setActionToast, showToast, updateListing]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      setActionToast(null);
      return;
    }

    setActionToast({
      message: copy.products.detailUnsavedChangesBar,
      primaryLabel: copy.products.detailMediaPendingSave,
      secondaryLabel: copy.products.detailDescriptionCancel,
      onPrimary: () => void saveFields(),
      onSecondary: resetFields,
      primaryDisabled: updatingListing,
      secondaryDisabled: updatingListing,
      ariaLabel: copy.products.detailUnsavedChangesAria,
    });
  }, [hasUnsavedChanges, resetFields, saveFields, setActionToast, updatingListing]);

  return (
    <div className="flex min-h-0 flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-6 lg:pl-0">
      <div className="min-w-0">
        <section aria-label={copy.products.detailSectionMedia}>
          <ListingMediaSection listing={listing} />
        </section>

        <h1 className="mt-7 text-xl font-semibold tracking-[-0.02em] text-zinc-900 sm:text-2xl">{listing.title}</h1>

        <section className="mt-7" aria-label={copy.products.detailSectionDescription}>
          {listing.description_html?.trim() ? (
            <div
              className="max-w-none text-[14px] leading-[1.65] text-zinc-600 [&_a]:font-medium [&_a]:text-zinc-900 [&_a]:underline [&_a]:decoration-zinc-300 [&_a]:underline-offset-2 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-medium [&_strong]:text-zinc-800 [&_ul]:list-disc [&_ul]:pl-4"
              dangerouslySetInnerHTML={{ __html: listing.description_html }}
            />
          ) : (
            <p className="text-sm italic text-zinc-500">{copy.products.detailNoDescription}</p>
          )}
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
                      className="relative z-[1] mt-px size-2 shrink-0 rounded-full border-2 border-white bg-zinc-300 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
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
                value={metadataForm.priceDollars}
                disabled={updatingListing}
                onChange={(e) =>
                  setMetadataForm((prev) => ({ ...prev, priceDollars: e.target.value }))
                }
                aria-label={copy.products.detailSidebarPrice}
                placeholder={formatListingPrice(0, listing.currency_code)}
                className={`${EDITABLE_RAIL_INPUT_CLASS} font-medium tabular-nums`}
              />
            </PropertyRow>
            <PropertyRow label={copy.products.detailSidebarSku}>
              <input
                type="text"
                value={metadataForm.sku}
                disabled={updatingListing}
                onChange={(e) => setMetadataForm((prev) => ({ ...prev, sku: e.target.value }))}
                aria-label={copy.products.detailSidebarSku}
                placeholder={copy.products.detailNone}
                className={`${EDITABLE_RAIL_INPUT_CLASS} placeholder:text-zinc-400`}
              />
            </PropertyRow>
            <PropertyRow label={copy.products.detailSidebarChannels}>
              <span className="text-zinc-400">{copy.products.detailChannelsNone}</span>
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

        <DetailRailCard title={copy.products.detailSidebarIntegrations} collapsible defaultOpen={false}>
          <ProductsListingIntegration listing={listing} />
        </DetailRailCard>

      </aside>
    </div>
  );
}
