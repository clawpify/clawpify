import { useEffect } from "react";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { copy } from "../../utils/copy";
import { CreditCardIcon } from "../../../../icons/workspace-icons";
import { OrganizationPricingTablePanel } from "./OrganizationPricingTablePanel.tsx";

export function BillingPage() {
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig({
      context: copy.billing.headerContext,
      contextIcon: <CreditCardIcon size={20} className="shrink-0 text-zinc-700" />,
    });
    return () => setConfig({});
  }, [setConfig]);

  return (
    <main
      className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white"
      style={{ fontFamily: "var(--workspace-font)" }}
    >
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-lg font-semibold text-zinc-900">{copy.billing.pageTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600">
            {copy.billing.pageDescription}
          </p>
        </header>
        <OrganizationPricingTablePanel />
        <p className="mt-4 text-xs leading-relaxed text-zinc-500">{copy.billing.footerNote}</p>
      </div>
    </main>
  );
}
