import { useState } from "react";
import { SignInButton } from "@clerk/react";
import { subscribe } from "../utils/networkFns";
import { HeroModalShell } from "./HeroModalShell";

export function RateLimitModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await subscribe({ email: email.trim() });
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <HeroModalShell onClose={onClose}>
      <h2 className="font-serif text-xl italic leading-tight text-[#26251e]">
        You've hit the free audit limit
      </h2>
      <p className="mt-2 font-mono text-[0.72rem] font-medium uppercase tracking-widest text-[#8a8378]">
        Free users can run 2 audits per day. Sign in to unlock unlimited
        audits, or subscribe to our newsletter to stay in the loop.
      </p>

      <div className="mt-8 flex flex-col gap-5">
        <SignInButton mode="redirect" forceRedirectUrl="/audit">
          <button
            type="button"
            className="w-full bg-[#1d1d1f] px-4 py-3 font-mono text-[0.68rem] font-medium uppercase tracking-widest text-white transition hover:bg-[#333]"
          >
            Sign in to continue
          </button>
        </SignInButton>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[rgba(0,0,0,0.1)]" />
          <span className="font-mono text-[0.62rem] font-medium uppercase tracking-widest text-[#8a8378]">
            or
          </span>
          <div className="h-px flex-1 bg-[rgba(0,0,0,0.1)]" />
        </div>

        {subscribed ? (
          <p className="border border-[rgba(0,0,0,0.1)] bg-[#f5f5f5] px-4 py-3 text-center font-mono text-[0.68rem] font-medium uppercase tracking-widest text-[#555]">
            Thank you for subscribing.
          </p>
        ) : (
          <form
            onSubmit={handleSubscribe}
            className="flex w-full border border-[rgba(0,0,0,0.1)] bg-white"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER YOUR EMAIL"
              disabled={loading}
              className="flex-1 min-w-0 bg-transparent px-3 py-2.5 font-mono text-[0.62rem] font-medium uppercase tracking-widest text-[#26251e] placeholder:text-[#8a8378] outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 bg-[#1d1d1f] px-4 py-2.5 font-mono text-[0.62rem] font-medium uppercase tracking-widest text-white transition hover:bg-[#333] disabled:opacity-60"
            >
              {loading ? "..." : "Subscribe"}
            </button>
          </form>
        )}

        {error && (
          <p className="text-center font-mono text-[0.62rem] text-red-600">{error}</p>
        )}
      </div>
    </HeroModalShell>
  );
}
