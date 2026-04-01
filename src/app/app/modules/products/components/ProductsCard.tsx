import type { ConsignmentListingDto } from "../types";
import { formatListingPrice } from "../utils/formatListingPrice";
import { listingPrimaryImageUrl } from "../utils/listingMedia";
import { PackageIcon } from "../../../../../icons/workspace-icons";

type Props = {
  listing: ConsignmentListingDto;
  selected: boolean;
  onSelect: () => void;
};

export function ProductsCard({ listing, selected, onSelect }: Props) {
  const src = listingPrimaryImageUrl(listing);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col overflow-hidden rounded-lg border text-left transition ${
        selected
          ? "border-zinc-300 bg-zinc-50 ring-1 ring-zinc-200"
          : "border-zinc-200/90 bg-white hover:border-zinc-300 hover:bg-zinc-50/50"
      }`}
    >
      <div className="relative aspect-square w-full bg-zinc-100">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-400">
            <PackageIcon size={28} className="text-zinc-400" />
          </span>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 p-2.5">
        <div className="line-clamp-2 text-xs font-medium leading-snug text-zinc-900">{listing.title}</div>
        <div className="mt-auto flex items-center justify-between gap-1 text-[11px] text-zinc-500">
          <span className="truncate capitalize">{listing.status}</span>
          <span className="shrink-0 tabular-nums text-zinc-700">
            {formatListingPrice(listing.price_cents, listing.currency_code)}
          </span>
        </div>
      </div>
    </button>
  );
}
