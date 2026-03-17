import { AnimatePresence } from "framer-motion";
import { Footer } from "../landing/components/Footer";
import { AuditProvider, useAudit } from "./context";
import { AuditForm } from "./components/AuditForm";
import { AuditResults } from "./components/AuditResults";
import { AuditEmptyState } from "./components/AuditEmptyState";
import { RateLimitModal } from "./components/RateLimitModal";
import { SignUpModal } from "./components/SignUpModal";

function AuditContent() {
  const { step, data, rateLimited, dismissRateLimit, showSignUpModal, setShowSignUpModal, submit } = useAudit();

  const showAnalysis = step === "loading" || (step === "results" && !!data);
  const showEmptyState =
    !data && (step === "form" || step === "generating" || step === "results");

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f3f1]">
      <div className="flex min-h-0 flex-1 min-w-0 flex-col overflow-y-auto">
        <div className="flex min-w-0">
          <div className="flex min-w-0 flex-1 flex-col p-2 md:p-4">
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
          <aside className="flex w-80 shrink-0 flex-col overflow-hidden bg-[#f2f3f1] p-8">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AuditForm />
            </div>
          </aside>
        </div>
        <Footer />
      </div>

      <AnimatePresence>
        {rateLimited && <RateLimitModal onClose={dismissRateLimit} />}
        {showSignUpModal && (
          <SignUpModal
            onClose={() => setShowSignUpModal(false)}
            onContinue={() => {
              setShowSignUpModal(false);
              submit();
            }}
          />
        )}
      </AnimatePresence>
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
