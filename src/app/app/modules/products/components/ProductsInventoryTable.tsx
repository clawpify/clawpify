import { copy } from "../../../utils/copy";
import type { ConsignmentListingDto } from "../types";
import { formatListingPrice } from "../utils/formatListingPrice";
import { formatListingAge } from "../utils/formatListingAge";
import { listingPrimaryImageUrl } from "../utils/listingMedia";
import { ProductsStatusBadge } from "./ProductsStatusBadge";
import { PackageIcon, TrashIcon } from "../../../../../icons/workspace-icons";

type Props = {
  listings: ConsignmentListingDto[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  deleteDisabled?: boolean;
  className?: string;
};

function categoryLabel(listing: ConsignmentListingDto): string {
  const t = listing.product_type?.trim();
  if (t) return t;
  if (listing.tags?.length) return listing.tags[0] ?? "";
  return copy.products.categoryUncategorized;
}

function rowMetaLine(listing: ConsignmentListingDto): string {
  const sku = listing.sku?.trim();
  const cat = categoryLabel(listing);
  const age = formatListingAge(listing.updated_at);
  const left = sku ? `${copy.products.colSku} ${sku}` : cat;
  if (!age) return left;
  return `${left} · ${age}`;
}

export function ProductsInventoryTable({ listings, onSelect, onDelete, deleteDisabled, className }: Props) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-0 py-16 text-center">
        <p className="text-sm font-medium text-zinc-700">{copy.products.filterEmptyTitle}</p>
        <p className="mt-1 text-sm text-zinc-500">{copy.products.filterEmptyHint}</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-0 flex-1 overflow-auto pb-16 sm:pb-24${className ? ` ${className}` : ""}`}
      role="list"
      aria-label={copy.products.pageHeading}
    >
      <div
        className="sticky top-0 z-10 flex items-center gap-4 bg-white/90 py-2.5 pl-0 pr-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 backdrop-blur-sm"
        style={{ fontFamily: "var(--workspace-font)" }}
      >
        <div className="min-w-0 flex-1">{copy.products.colProduct}</div>
        <div className="hidden w-[7.5rem] shrink-0 sm:block">{copy.products.colStatus}</div>
        <div className="hidden w-[8.5rem] shrink-0 lg:block">{copy.products.colCategory}</div>
        <div className="hidden w-24 shrink-0 text-right sm:block">{copy.products.colPrice}</div>
        <div className="hidden w-14 shrink-0 text-right md:block">{copy.products.colChannels}</div>
        <div className="w-9 shrink-0" aria-hidden />
      </div>

      {listings.map((listing) => {
        const src = listingPrimaryImageUrl(listing);
        return (
          <div
            key={listing.id}
            role="listitem"
            tabIndex={0}
            onClick={() => onSelect(listing.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(listing.id);
              }
            }}
            className="group flex cursor-pointer items-center gap-4 py-3 pl-0 pr-2 transition-colors hover:bg-black/[0.03]"
            style={{ fontFamily: "var(--workspace-font)" }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-zinc-100/80">
                {src ? (
                  <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-zinc-300">
                    <PackageIcon size={18} className="text-zinc-300" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{listing.title}</p>
                <p className="truncate text-xs text-zinc-500">{rowMetaLine(listing)}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2 sm:hidden">
                  <ProductsStatusBadge status={listing.status} />
                  <span className="shrink-0 text-sm font-medium tabular-nums text-zinc-800">
                    {formatListingPrice(listing.price_cents, listing.currency_code)}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden w-[7.5rem] shrink-0 sm:block">
              <ProductsStatusBadge status={listing.status} />
            </div>

            <div className="hidden w-[8.5rem] shrink-0 truncate text-sm text-zinc-600 lg:block">{categoryLabel(listing)}</div>

            <div className="hidden w-24 shrink-0 text-right text-sm tabular-nums text-zinc-800 sm:block">
              {formatListingPrice(listing.price_cents, listing.currency_code)}
            </div>

            <div className="hidden w-14 shrink-0 text-right text-sm tabular-nums text-zinc-400 md:block">—</div>

            <div className="w-9 shrink-0 text-right" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                disabled={deleteDisabled}
                title={copy.products.deleteListing}
                aria-label={copy.products.deleteListing}
                onClick={() => {
                  if (!window.confirm(copy.products.deleteListingConfirm)) return;
                  onDelete(listing.id);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-300 opacity-100 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 sm:text-zinc-400 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              >
                <TrashIcon size={16} className="text-current" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
