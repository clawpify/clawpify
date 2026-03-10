import { Link } from "react-router-dom";
import { Show, SignInButton, UserButton } from "@clerk/react";
import { AuditProvider, useAudit } from "./context";
import { AuditForm } from "./components/AuditForm";
import { AuditLoading } from "./components/AuditLoading";
import { AuditResults } from "./components/AuditResults";
import { AuditEmptyState } from "./components/AuditEmptyState";
import { PromptContainer } from "../landing/components/PromptContainer";

function AuditContent() {
  const { step, data } = useAudit();

  const showEmptyState =
    (step === "results" || step === "form" || step === "generating") && !data;
  const showLoading = step === "loading";
  const showResults = step === "results" && data;

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f3f1]">
      <header className="flex shrink-0 items-center justify-between bg-zinc-100/80 px-6 py-5 md:px-8 md:py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 rounded bg-[#2563eb]" />
          <span className="font-mono text-lg font-medium uppercase tracking-wide text-zinc-900">
            CLAWPIFY
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="redirect" forceRedirectUrl="/audit">
              <button
                type="button"
                className="font-mono rounded-none border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium uppercase tracking-wide text-zinc-900 transition hover:bg-zinc-100"
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
      <div className="flex flex-1 min-w-0 flex-col">
        <div className="flex flex-1 flex-col p-2 md:p-4">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            {showLoading && (
              <div className="flex flex-1 flex-col items-center justify-center p-8">
                <AuditLoading
                  message="Generating prompts and competitor suggestions..."
                />
              </div>
            )}

            {showEmptyState && (
              <div className="flex flex-1 flex-col p-4 md:p-6">
                <AuditEmptyState />
              </div>
            )}

            {showResults && (
              <div className="flex flex-1 flex-col p-4 md:p-6">
                <AuditResults />
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className="sticky top-0 flex h-screen w-80 shrink-0 flex-col overflow-hidden bg-[#f2f3f1] p-8">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AuditForm />
        </div>
        <div className="mt-6 shrink-0 border-t border-zinc-200 pt-6">
          <PromptContainer />
        </div>
      </aside>
      </div>
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
