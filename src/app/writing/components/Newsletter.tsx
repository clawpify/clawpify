import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <section className="relative overflow-hidden bg-[#f2f3f1] py-16 md:py-24">
      <div className="newsletter-grid absolute inset-y-0 left-1/2 -translate-x-1/2 w-[99%] h-full" />
      <div className="mx-auto max-w-[995px] px-5 md:px-8">
        <div className="relative flex flex-col items-center justify-center">

          <h2 className="relative z-10 font-serif text-[clamp(1.6rem,4vw,2.4rem)] italic leading-[1.15] text-[#26251e] mb-8 text-center">
            Subscribe to<br />our newsletter
          </h2>

          {submitted ? (
            <p className="relative z-10 font-mono text-[0.72rem] font-medium uppercase tracking-widest text-[#26251e]">
              Thank you for subscribing.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="relative z-10 flex w-full max-w-xs border border-zinc-300 bg-white"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ENTER YOUR EMAIL"
                className="flex-1 min-w-0 bg-transparent px-3 py-2.5 font-mono text-[0.62rem] font-medium uppercase tracking-widest text-[#26251e] placeholder:text-[#8a8378] outline-none"
              />
              <button
                type="submit"
                className="shrink-0 bg-[#1d1d1f] px-4 py-2.5 font-mono text-[0.62rem] font-medium uppercase tracking-widest text-white transition hover:bg-[#333]"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
