import { EllipsisHorizontalIcon, InboxIcon } from "@/icons/workspace-icons";
import { useOrgPaidFeature } from "@/lib/useOrgPaidFeature.ts";
import { UnpaidOrgPricingView } from "../billing/UnpaidOrgPricingView.tsx";
import { copy } from "../../utils/copy";
import { ClawpifyLoadingScreen } from "../../components/ClawpifyLoadingScreen";

export function HomeContent() {
  const paid = useOrgPaidFeature();

  if (paid === null) {
    return <ClawpifyLoadingScreen variant="fill" message={copy.settingUpWorkspace} />;
  }

  if (!paid) {
    return <UnpaidOrgPricingView />;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col md:flex-row">
      <div className="flex min-h-[36vh] w-full shrink-0 flex-col border-zinc-100 md:min-h-0 md:max-w-md md:flex-[0_0_38%] md:border-b-0 md:border-r">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
          <h1 className="min-w-0 truncate text-sm font-semibold text-zinc-900">{copy.inbox.heading}</h1>
          <button
            type="button"
            className="shrink-0 rounded p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
            aria-label={copy.inbox.menuActions}
          >
            <EllipsisHorizontalIcon size={18} className="shrink-0 text-zinc-500" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
            <InboxIcon size={40} className="shrink-0 text-zinc-300" />
            <p className="mt-3 text-sm font-medium text-zinc-700">{copy.inbox.listEmptyTitle}</p>
            <p className="mt-1 max-w-[240px] text-sm leading-relaxed text-zinc-500">
              {copy.inbox.listEmptyDesc}
            </p>
          </div>
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-8 py-6">
          <p className="text-base font-medium text-emerald-900">{copy.billing.premiumBadge}</p>
        </div>
      </div>
    </div>
  );
}
