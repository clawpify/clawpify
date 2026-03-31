import { PackageIcon } from "../../../../../icons/workspace-icons";
import { copy } from "../../../utils/copy";

/** Linear-inspired centered empty state when there are no listings yet. */
export function ProductsEmptyState() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center py-12 sm:py-16"
      style={{ fontFamily: "var(--workspace-font)" }}
    >
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200/90 bg-white text-zinc-400 shadow-sm">
          <PackageIcon size={28} className="text-zinc-400" />
        </div>
        <h2 className="mt-6 text-xl font-semibold tracking-tight text-zinc-900">{copy.products.emptyHeroTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">{copy.products.emptyHeroBody}</p>
        <p className="mt-2 text-xs text-zinc-400">{copy.products.emptyHeroHint}</p>
      </div>
    </div>
  );
}
