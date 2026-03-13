import { Link } from "react-router-dom";
import { Show, SignInButton, UserButton } from "@clerk/react";
import { AuditProvider, useAudit } from "./context";
import { AuditForm } from "./components/AuditForm";
import { AuditResults } from "./components/AuditResults";
import { AuditEmptyState } from "./components/AuditEmptyState";
import { WaitlistModal } from "./components/WaitlistModal";

function AuditContent() {
  const { step, data, showWaitlistModal, closeWaitlistModal } = useAudit();

  const showAnalysis = step === "loading" || (step === "results" && !!data);
  const showEmptyState =
    !data && (step === "form" || step === "generating" || step === "results");

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f3f1]">
      <header className="flex shrink-0 items-center justify-between bg-zinc-100/80 px-6 py-5 md:px-8 md:py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 rounded bg-[#b5ddfb]" />
          <span className="font-mono text-lg font-medium uppercase tracking-wide text-zinc-900">
            CLAWPIFY
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="redirect" forceRedirectUrl="/audit">
              <button
                type="button"
                className="font-mono rounded-sm border border-zinc-200 bg-transparent px-4 py-3 text-sm font-medium uppercase text-[#26251e] transition"
              >
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton afterSignOutUrl="/audit" />
          </Show>
        </div>
      </header>

      <div className="flex flex-1 min-w-0 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col p-2 md:p-4">
          <div className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
            {showEmptyState && (
              <div className="flex flex-col p-2 md:p-4 pb-2 md:pb-4">
                <AuditEmptyState />
              </div>
            )}

            {showAnalysis && (
              <div className="flex flex-col p-2 md:p-4">
                <AuditResults />
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className="sticky top-0 flex h-full w-80 shrink-0 flex-col overflow-hidden bg-[#f2f3f1] p-8">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AuditForm />
        </div>
      </aside>
      </div>

      <WaitlistModal open={showWaitlistModal} onClose={closeWaitlistModal} />
    </div>
  );
}

export function AuditPage() {
  return (
    <AuditProvider>
      <AuditContent />
    </AuditProvider>
  );
}
