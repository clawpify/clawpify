import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useWorkspaceHeader } from "../../../context/WorkspaceHeaderContext";
import { copy } from "../../../utils/copy";
import { CONSIGNORS_API_LIST } from "../utils/consignorsApi";

export function ConsignorsPage() {
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig({ hideHeader: true });
    return () => setConfig({});
  }, [setConfig]);

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-xl font-semibold text-zinc-900">{copy.consignorsPage.title}</h2>
          <p className="mt-2 text-sm text-zinc-500">{copy.consignorsPage.body}</p>
          <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">
            {CONSIGNORS_API_LIST}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
            <Link
              to="/app/contracts"
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            >
              {copy.consignorsPage.nextContracts}
            </Link>
            <Link
              to="/app/products"
              className="text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 hover:decoration-zinc-500"
            >
              {copy.consignorsPage.productsLink}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
