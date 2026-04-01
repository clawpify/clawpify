import { copy } from "../../../utils/copy";
import type { ConsignmentListingDto } from "../types";
import { formatListingPrice } from "../utils/formatListingPrice";

const listingStatusLabel = (listing: ConsignmentListingDto) => {
  if (listing.acceptance_status === "accepted") return "approved";
  if (listing.acceptance_status === "declined") return "declined";
  if (listing.acceptance_status === "pending") return "pending";
  return listing.status;
};

const listingStatusClassName = (listing: ConsignmentListingDto) => {
  const status = listingStatusLabel(listing).toLowerCase();

  if (status === "approved") return "bg-emerald-100 text-emerald-800";
  if (status === "draft") return "bg-zinc-100 text-zinc-700";
  if (status === "declined") return "bg-rose-100 text-rose-800";
  if (status === "pending") return "bg-amber-100 text-amber-800";
  return "bg-zinc-100 text-zinc-700";
};

type ProductsTableProps = {
  listings: ConsignmentListingDto[];
  onSelectListing?: (listing: ConsignmentListingDto) => void;
};

export function ProductsTable({ listings, onSelectListing }: ProductsTableProps) {
  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200/80">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-zinc-200/80 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">{copy.products.colSku}</th>
            <th className="px-4 py-3">{copy.products.colTitle}</th>
            <th className="px-4 py-3">{copy.products.colStatus}</th>
            <th className="px-4 py-3 text-right">{copy.products.colPrice}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {listings.map((row) => (
            <tr
              key={row.id}
              className="text-zinc-800 transition hover:bg-zinc-50 cursor-pointer"
              onClick={() => onSelectListing?.(row)}
              onKeyDown={(e) => {
                if (!onSelectListing) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectListing(row);
                }
              }}
              tabIndex={onSelectListing ? 0 : -1}
              role={onSelectListing ? "button" : undefined}
              aria-label={onSelectListing ? `Open details for ${row.title}` : undefined}
            >
              <td className="max-w-[120px] truncate px-4 py-3 font-mono text-xs text-zinc-600">
                {row.sku || "—"}
              </td>
              <td className="max-w-[280px] truncate px-4 py-3 font-medium text-zinc-900">{row.title}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs ${listingStatusClassName(row)}`}
                >
                  {listingStatusLabel(row)}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                {formatListingPrice(row.price_cents, row.currency_code)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
