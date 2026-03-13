import { useState } from "react";
import { joinWaitlist } from "../utils/networkFns";

type Props = {
  open: boolean;
  onClose: () => void;
};

const GITHUB_URL = "https://github.com/clawpify/clawpify";

export function WaitlistModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [alreadyOnList, setAlreadyOnList] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setErrorMsg("Please enter a valid email");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await joinWaitlist({ email: trimmed });
      setStatus("success");
      setAlreadyOnList(res.already_on_list);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-md"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-title"
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="waitlist-title"
            className="font-mono text-lg font-medium uppercase tracking-wider text-zinc-900"
          >
            Join the Clawpify waitlist
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {status === "success" ? (
          <div className="mt-6">
            <p className="text-sm text-zinc-600">
              {alreadyOnList
                ? "You're already on the list! We'll be in touch."
                : "Thanks! We'll be in touch."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 font-mono text-sm font-medium uppercase text-[#26251e] transition hover:underline"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm text-zinc-600">
              We're open source —{" "}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition hover:text-zinc-900"
              >
                check out our progress
              </a>
            </p>

            <div className="space-y-1">
              <label htmlFor="waitlist-email" className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
                Email
              </label>
              <input
                id="waitlist-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status === "loading"}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#26251e] focus:outline-none focus:ring-1 focus:ring-[#26251e] disabled:bg-zinc-50"
              />
            </div>

            {status === "error" && errorMsg && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                disabled={status === "loading"}
                className="font-mono w-full rounded-sm border border-[#26251e] bg-[#26251e] px-4 py-3 text-sm font-medium uppercase text-white transition hover:bg-[#1a1914] hover:border-[#1a1914] disabled:opacity-50"
              >
                {status === "loading" ? "Joining..." : "Join the waitlist"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-zinc-500 transition hover:text-zinc-900"
              >
                Maybe later
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
