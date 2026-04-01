import { Link } from "react-router-dom";
import { copy } from "../../../utils/copy";

type ProductsEmptyStateProps = {
  className?: string;
  onClose?: () => void;
};

export function ProductsEmptyState({ className, onClose }: ProductsEmptyStateProps = {}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-6 ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">{copy.products.setupTitle}</h3>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
            aria-label="Close setup overview"
          >
            Close
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-zinc-500">{copy.products.emptyHint}</p>
      <ol className="mt-4 flex flex-col gap-3 text-sm">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
            1
          </span>
          <div>
            <Link to="/app/consignors" className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-600">
              {copy.products.setupStepConsignors}
            </Link>
            <p className="text-zinc-500">{copy.products.setupStepConsignorsDesc}</p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
            2
          </span>
          <div>
            <p className="font-medium text-zinc-900">{copy.products.setupStepListing}</p>
            <p className="text-zinc-500">{copy.products.setupStepListingDesc}</p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
            3
          </span>
          <div>
            <Link to="/app/contracts" className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-600">
              {copy.products.setupStepContracts}
            </Link>
            <p className="text-zinc-500">{copy.products.setupStepContractsDesc}</p>
          </div>
        </li>
      </ol>
    </div>
  );
}
