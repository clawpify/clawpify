import { useState } from "react";
import { submitAuditLead } from "../utils/networkFns";
import { HeroModalShell } from "./HeroModalShell";

const AI_EXPLORE_LINKS = [
  {
    label: "ChatGPT",
    href: "https://chat.openai.com/?q=tell+me+about+clawpify.com",
    className: "text-[#26251e] hover:text-[#000000]",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.28 9.82a5.98 5.98 0 00-.52-4.91 6.05 6.05 0 00-6.51-2.9A6.07 6.07 0 004.98 4.18a5.98 5.98 0 00-4 2.9 6.05 6.05 0 00.74 7.1 5.98 5.98 0 00.51 4.91 6.05 6.05 0 006.52 2.9A5.98 5.98 0 0013.26 24a6.06 6.06 0 005.77-4.21 5.99 5.99 0 004-2.9 6.06 6.06 0 00-.75-7.07zM13.26 22.43a4.48 4.48 0 01-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 00.39-.68v-6.74l2.02 1.17a.07.07 0 01.04.05v5.58a4.5 4.5 0 01-4.49 4.5zM3.6 18.3a4.47 4.47 0 01-.54-3.01l.14.08 4.78 2.76a.77.77 0 00.78 0l5.84-3.37v2.33a.08.08 0 01-.03.06l-4.84 2.79a4.5 4.5 0 01-6.13-1.64zM2.34 7.9a4.49 4.49 0 012.37-1.98v5.68a.77.77 0 00.39.68l5.82 3.36-2.02 1.17a.08.08 0 01-.07 0l-4.83-2.79A4.5 4.5 0 012.34 7.9zm16.6 3.86l-5.83-3.39 2.02-1.16a.08.08 0 01.07 0l4.83 2.79a4.49 4.49 0 01-.68 8.1V12.43a.79.79 0 00-.41-.67zm2.01-3.02l-.14-.09-4.78-2.78a.78.78 0 00-.78 0l-5.84 3.37V6.9a.07.07 0 01.03-.06l4.83-2.79a4.5 4.5 0 016.68 4.66zM8.31 12.87l-2.02-1.16a.08.08 0 01-.04-.06V6.08a4.5 4.5 0 017.38-3.46l-.14.08-4.78 2.76a.8.8 0 00-.4.68zm1.1-2.37l2.6-1.5 2.61 1.5v3l-2.6 1.5-2.61-1.5z" />
      </svg>
    ),
  },
  {
    label: "Perplexity",
    href: "https://www.perplexity.ai/search?q=what+is+clawpify.com",
    className: "text-[#1fb8a6] hover:text-[#169988]",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" />
      </svg>
    ),
  },
  {
    label: "Claude",
    href: "https://claude.ai/new?q=tell+me+about+clawpify.com",
    className: "text-[#d97706] hover:text-[#b45309]",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
        <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
      </svg>
    ),
  },
  {
    label: "Gemini",
    href: "https://gemini.google.com/app?q=tell+me+about+clawpify.com",
    className: "text-[#4f46e5] hover:text-[#4338ca]",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" />
      </svg>
    ),
  },
  {
    label: "Grok",
    href: "https://grok.x.ai/?q=tell+me+about+clawpify.com",
    className: "text-[#26251e] hover:text-[#000000]",
    icon: (
      <svg width={16} height={16} viewBox="0 0 512 510" fill="currentColor">
        <path d="M213.235 306.019l178.976-180.002v.169l51.695-51.763c-.924 1.32-1.86 2.605-2.785 3.89-39.281 54.164-58.46 80.649-43.07 146.922l-.09-.101c10.61 45.11-.744 95.137-37.398 131.836-46.216 46.306-120.167 56.611-181.063 14.928l42.462-19.675c38.863 15.278 81.392 8.57 111.947-22.03 30.566-30.6 37.432-75.159 22.065-112.252-2.92-7.025-11.67-8.795-17.792-4.263l-124.947 92.341zm-25.786 22.437l-.033.034L68.094 435.217c7.565-10.429 16.957-20.294 26.327-30.149 26.428-27.803 52.653-55.359 36.654-94.302-21.422-52.112-8.952-113.177 30.724-152.898 41.243-41.254 101.98-51.661 152.706-30.758 11.23 4.172 21.016 10.114 28.638 15.639l-42.359 19.584c-39.44-16.563-84.629-5.299-112.207 22.313-37.298 37.308-44.84 102.003-1.128 143.81z" />
      </svg>
    ),
  },
] as const;

const INTEREST_OPTIONS = [
  { value: "book_call", label: "Book a call" },
  { value: "product_updates", label: "Product updates" },
  { value: "just_trying", label: "Just trying the tool" },
] as const;

const inputClass =
  "w-full border border-[rgba(0,0,0,0.1)] bg-white px-3 py-3 font-mono text-[0.82rem] text-[#26251e] placeholder:text-[#6f675d] outline-none focus:border-[rgba(0,0,0,0.25)] disabled:opacity-60";

export function SignUpModal({
  onClose,
  onContinue,
}: {
  onClose: () => void;
  onContinue: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [interest, setInterest] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await submitAuditLead({
        name: name.trim(),
        email: email.trim(),
        newsletter_opt_in: newsletterOptIn,
        interest: interest || undefined,
      });
      localStorage.setItem("clawpify_audit_signup_dismissed", "1");
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <HeroModalShell onClose={onClose} size="large">
      <div className="relative mb-6 -mx-14 -mt-12 overflow-hidden bg-[#f2f3f1] px-14 pt-6 pb-6">
        <div className="newsletter-grid absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#ffffff] via-[#ffffff]/60 to-transparent"
          aria-hidden
        />
        <div className="relative z-10">
          <h2 className="font-serif text-[1.65rem] italic leading-tight text-[#1f1d19]">
            Help you be more visible in agentic e-commerce
          </h2>
          <p className="mt-3 max-w-2xl font-mono text-[0.88rem] leading-6 text-[#4f4a42]">
            Run your AI visibility analysis to see how you stack up.
          </p>
          <div className="mt-4 flex items-center gap-3">
            {AI_EXPLORE_LINKS.map((ai) => (
              <a
                key={ai.label}
                href={ai.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Explore Clawpify on ${ai.label}`}
                className={`${ai.className} transition`}
              >
                {ai.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <p className="font-mono text-[0.9rem] font-medium leading-6 text-[#3f3a32]">
        Share a few details to get started.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="YOUR NAME"
          disabled={loading}
          className={inputClass}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="EMAIL"
          disabled={loading}
          className={inputClass}
        />
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={newsletterOptIn}
            onChange={(e) => setNewsletterOptIn(e.target.checked)}
            disabled={loading}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 disabled:opacity-60"
          />
          <span className="font-mono text-[0.84rem] leading-6 text-[#3f3a32]">
            Would you like newsletter updates via email?
          </span>
        </label>
        <label className="block">
          <span className="mb-2 block font-mono text-[0.84rem] leading-6 text-[#3f3a32]">
            Would you love to book a call? Let us know what you&apos;re
            interested in so we can reach out.
          </span>
          <select
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            disabled={loading}
            className={inputClass}
          >
            <option value="">Interested in...</option>
            {INTEREST_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p className="font-mono text-[0.62rem] text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1d1d1f] px-4 py-3 font-mono text-[0.82rem] font-medium uppercase tracking-[0.18em] text-white transition hover:bg-[#333] disabled:opacity-60"
        >
          {loading ? "..." : "Run free AI analysis"}
        </button>
      </form>
    </HeroModalShell>
  );
}
