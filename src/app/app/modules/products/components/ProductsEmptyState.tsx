import { Link } from "react-router-dom";
import { copy } from "../../../utils/copy";

export function ProductsEmptyState() {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-6">
      <h3 className="text-sm font-semibold text-zinc-900">{copy.products.setupTitle}</h3>
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
            <Link to="/app/contracts" className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-600">
              {copy.products.setupStepContracts}
            </Link>
            <p className="text-zinc-500">{copy.products.setupStepContractsDesc}</p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
            3
          </span>
          <div>
            <p className="font-medium text-zinc-900">{copy.products.setupStepListing}</p>
            <p className="text-zinc-500">{copy.products.setupStepListingDesc}</p>
          </div>
        </li>
      </ol>
    </div>
  );
}
