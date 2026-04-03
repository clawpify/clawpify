import { useId, useState, type CSSProperties, type FormEvent } from "react";
import { subscribe } from "../../../lib/subscribe";
import { landingCopy, landingPalette } from "../utils";
import { landingOrangeBubbleClassName, landingOrangeBubbleStyle } from "./Button";

const waitlistOuterStyle: CSSProperties = {
  background: landingPalette.mainPanel.background,
  borderColor: landingPalette.mainPanel.border,
  boxShadow: [
    landingPalette.mainPanel.boxShadow,
    "0 4px 14px rgba(0, 0, 0, 0.07)",
    "0 1px 2px rgba(0, 0, 0, 0.04)",
  ].join(", "),
};

const waitlistOuterClassName = [
  "flex w-full rounded-full border p-[3px]",
  "antialiased",
].join(" ");

const submitClassName = [
  landingOrangeBubbleClassName,
  "landing-sans-copy inline-flex shrink-0 items-center justify-center rounded-full px-5 py-2.5 text-sm",
].join(" ");

type InputProps = {
  className?: string;
};

export function Input({ className = "" }: InputProps) {
  const inputId = useId();
  const { heroWaitlist } = landingCopy;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
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
    <div
      className={["flex w-full max-w-md flex-col items-center gap-2", className].filter(Boolean).join(" ")}
    >
      {submitted ? (
        <p className="landing-sans-copy text-center text-base text-zinc-800 md:text-lg">
          {heroWaitlist.successMessage}
        </p>
      ) : (
        <>
          <div className={waitlistOuterClassName} style={waitlistOuterStyle}>
            <form onSubmit={handleSubmit} className="relative z-[2] w-full min-w-0">
              <div className="flex w-full min-w-0 flex-col gap-2 rounded-[999px] bg-white p-2 sm:flex-row sm:items-stretch sm:gap-1 sm:p-1 sm:pl-3 sm:pr-1 md:pl-4">
                <label htmlFor={inputId} className="sr-only">
                  {heroWaitlist.emailLabel}
                </label>
                <input
                  id={inputId}
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={heroWaitlist.placeholder}
                  disabled={loading}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${inputId}-error` : undefined}
                  className="landing-sans-copy min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-zinc-900 outline-none ring-0 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-60 sm:px-0 sm:py-2.5"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={[submitClassName, "w-full justify-center sm:w-auto"].join(" ")}
                  style={landingOrangeBubbleStyle}
                >
                  <span className="relative z-[2]">
                    {loading ? heroWaitlist.submittingLabel : heroWaitlist.submitLabel}
                  </span>
                </button>
              </div>
            </form>
          </div>
          {error ? (
            <p
              id={`${inputId}-error`}
              className="landing-sans-copy text-center text-sm text-red-600"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
