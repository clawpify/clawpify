import { OrganizationPricingTablePanel } from "./OrganizationPricingTablePanel.tsx";

/** Full main-area pricing table for orgs without the paid feature (Inbox / Products). */
export function UnpaidOrgPricingView() {
  return (
    <main
      className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white"
      style={{ fontFamily: "var(--workspace-font)" }}
    >
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <OrganizationPricingTablePanel />
      </div>
    </main>
  );
}
