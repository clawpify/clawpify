import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { copy } from "../../../utils/copy";
import type { ConsignmentListingDto } from "../types";
import { buildListingTimelineEvents } from "../utils/buildListingTimelineEvents";
import { formatListingPrice } from "../utils/formatListingPrice";
import { listingImageUrls } from "../utils/listingMedia";
import { statusDotClass } from "../utils/productStatusTab";
import { PlusIcon } from "../../../../../icons/workspace-icons";

type Props = {
  listing: ConsignmentListingDto;
};

const RAIL_CARD_SHADOW =
  "shadow-[0_1px_3px_rgba(15,23,42,0.08),0_1px_2px_-1px_rgba(15,23,42,0.06)]";

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

function categoryLabel(listing: ConsignmentListingDto): string {
  const t = listing.product_type?.trim();
  if (t) return t;
  if (listing.tags?.length) return listing.tags[0] ?? "";
  return copy.products.categoryUncategorized;
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

/** Design-only: file/drop handlers reset input; persistence comes in phase 2. */
function noopFiles(e: React.ChangeEvent<HTMLInputElement>) {
  e.target.value = "";
}

function ListingMediaDropzoneEmpty({ fileInputRef }: { fileInputRef: React.RefObject<HTMLInputElement | null> }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`flex min-h-[11rem] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-200/90 bg-zinc-50/60 px-4 py-8 transition-colors sm:min-h-[12.5rem] ${
        dragOver ? "border-zinc-300 bg-zinc-100/80" : ""
      }`}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={noopFiles}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label={copy.products.detailMediaAddAria}
        className="text-sm font-medium text-zinc-700 underline-offset-4 transition hover:text-zinc-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        {copy.products.detailMediaAdd}
      </button>
      <p className="text-xs text-zinc-400">{copy.products.detailMediaDropHint}</p>
    </div>
  );
}

type ListingMediaGalleryProps = {
  images: string[];
  heroIndex: number;
  heroSrc: string | null;
  onSelectHero: (i: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

function ListingMediaGallery({ images, heroIndex, heroSrc, onSelectHero, fileInputRef }: ListingMediaGalleryProps) {
  return (
    <div className="space-y-3">
      <div
        className="flex min-h-[12rem] max-h-[min(22rem,56vw)] w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      >
        {heroSrc ? (
          <img
            src={heroSrc}
            alt=""
            className="max-h-[22rem] w-full max-w-full object-contain"
            loading="lazy"
          />
        ) : null}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={noopFiles}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => onSelectHero(i)}
            aria-current={i === heroIndex ? "true" : undefined}
            aria-label={`${copy.products.detailSectionMedia} ${i + 1}`}
            className={`relative overflow-hidden rounded-md ring-1 ring-inset transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 ${
              i === heroIndex
                ? "ring-2 ring-zinc-900 ring-offset-1 ring-offset-white"
                : "ring-black/[0.06] hover:ring-zinc-300"
            }`}
          >
            <span className="block h-11 w-11 bg-zinc-100">
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={copy.products.detailMediaAddAria}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-dashed border-zinc-200/80 bg-white text-zinc-400 transition hover:border-zinc-300 hover:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          <PlusIcon size={18} className="text-current" />
        </button>
      </div>
    </div>
  );
}

export function ProductsListingDetail({ listing }: Props) {
  const images = useMemo(() => listingImageUrls(listing), [listing]);
  const [heroIndex, setHeroIndex] = useState(0);
  const timeline = useMemo(() => buildListingTimelineEvents(listing), [listing]);
  const tags = listing.tags ?? [];
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHeroIndex(0);
  }, [listing.id]);
  const heroSrc = images[heroIndex] ?? null;

  return (
    <div className="flex min-h-0 flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-6 lg:pl-0">
      <div className="min-w-0">
        <section aria-label={copy.products.detailSectionMedia}>
          {images.length === 0 ? (
            <ListingMediaDropzoneEmpty fileInputRef={detailFileInputRef} />
          ) : (
            <ListingMediaGallery
              images={images}
              heroIndex={heroIndex}
              heroSrc={heroSrc}
              onSelectHero={setHeroIndex}
              fileInputRef={detailFileInputRef}
            />
          )}
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
                  {/* Rail stretches to text height; line extends through row gap (pb-5) so it meets the next dot */}
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
              <span className="tabular-nums font-medium">
                {formatListingPrice(listing.price_cents, listing.currency_code)}
              </span>
            </PropertyRow>
            <PropertyRow label={copy.products.detailSidebarSku}>{skuLabel(listing)}</PropertyRow>
            <PropertyRow label={copy.products.detailSidebarCategory}>{categoryLabel(listing)}</PropertyRow>
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
