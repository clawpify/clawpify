import { Link } from "react-router-dom";
import { Show, SignInButton, UserButton } from "@clerk/react";

const SITUATIONS = [
  {
    type: "Deep research",
    whenUsed:
      "Reasoning models (o3-deep-research, gpt-5 high reasoning) conduct extended investigations, tapping hundreds of sources.",
    bestFor:
      "In-depth research; runs several minutes; use with background mode.",
  },
  {
    type: "Agentic search",
    whenUsed:
      "Model actively manages search as part of chain of thought, analyzes results, and decides whether to keep searching.",
    bestFor: "Complex workflows; more flexible but slower than quick lookups.",
  },
  {
    type: "Non-reasoning web search",
    whenUsed:
      "Model sends query to the web search tool, which returns results based on top sources with no internal planning.",
    bestFor: "Fast lookups; ideal for quick factual queries.",
  },
] as const;

export function WebSearchInfo() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f2f3f1]">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-100/80 px-6 py-5 md:px-8 md:py-6">
        <Link to="/audit" className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 rounded bg-[#2563eb]" />
          <span className="font-mono text-lg font-medium uppercase tracking-wide text-zinc-900">
            CLAWPIFY
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/audit"
            className="font-mono text-sm font-medium uppercase tracking-wide text-zinc-600 transition hover:text-zinc-900"
          >
            ← Back to audit
          </Link>
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

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Web Search Situations
          </h1>
          <div className="space-y-4">
            {SITUATIONS.map((s) => (
              <div
                key={s.type}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <h2 className="font-medium text-zinc-900">{s.type}</h2>
                <p className="mt-2 text-sm text-zinc-600">{s.whenUsed}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  <strong>Best for:</strong> {s.bestFor}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
