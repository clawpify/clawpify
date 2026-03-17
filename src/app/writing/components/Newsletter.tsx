import { useState } from "react";
import { subscribe } from "../../audit/utils/networkFns";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await subscribe({ email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden bg-[#f2f3f1] py-16 md:py-24">
      <div className="mx-auto max-w-[995px] px-5 md:px-8">
        <div className="relative flex flex-col items-center justify-center">

          <h2 className="relative z-10 mb-8 text-center font-serif text-[clamp(1.6rem,4vw,2.4rem)] italic leading-[1.15] text-[#26251e]">
            Subscribe to<br />our updates
          </h2>

          {submitted ? (
            <p className="relative z-10 font-mono text-[0.72rem] font-medium uppercase tracking-widest text-[#26251e]">
              Thank you for subscribing.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="relative z-10 flex flex-col items-center gap-2 w-full max-w-xs"
            >
              <div className="flex w-full border border-zinc-300 bg-white">
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
              </div>
              {error && (
                <p className="font-mono text-[0.62rem] text-red-600">{error}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
