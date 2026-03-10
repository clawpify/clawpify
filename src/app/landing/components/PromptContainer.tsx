import { useState } from "react";
import {
  SHOPIFY_SIDEKICK_SEO_URL,
  CURSOR_PROMPT_DEEPLINK,
  SEO_SKILL_PROMPT_TEXT,
} from "../utils/seo-skill";

const COPIED_DURATION_MS = 1500;

const CursorIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
    aria-hidden
  >
    <path
      d="M12 2L22 12L12 22L7 17L2 12L12 2Z"
      fill="currentColor"
      fillOpacity="0.9"
    />
    <path
      d="M12 2L17 7L12 12L7 7L12 2Z"
      fill="currentColor"
      fillOpacity="0.6"
    />
  </svg>
);

export function PromptContainer() {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  const handleCopy = async (platform: string) => {
    try {
      await navigator.clipboard.writeText(SEO_SKILL_PROMPT_TEXT);
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), COPIED_DURATION_MS);
    } catch {
      setCopiedPlatform("error");
      setTimeout(() => setCopiedPlatform(null), COPIED_DURATION_MS);
    }
  };

  return (
    <div>
      <p className="mb-2 font-mono text-xs font-medium uppercase tracking-wide text-zinc-500">
        Use this SEO skill in:
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={SHOPIFY_SIDEKICK_SEO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono inline-flex items-center rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-900 transition hover:bg-zinc-100"
        >
          Shopify
        </a>
        <a
          href={CURSOR_PROMPT_DEEPLINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          <CursorIcon />
          Try in Cursor
        </a>
        <button
          type="button"
          onClick={() => handleCopy("claude")}
          className="font-mono inline-flex items-center rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-zinc-900 transition hover:bg-zinc-100"
        >
          {copiedPlatform === "claude" ? "Copied!" : "Claude"}
        </button>
      </div>
    </div>
  );
}
