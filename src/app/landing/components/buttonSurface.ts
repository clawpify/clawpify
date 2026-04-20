import type { CSSProperties } from "react";
import { landingAccentOrange } from "../utils";

export const SurfaceStyle: CSSProperties = {
  background: landingAccentOrange.gradient,
  borderColor: landingAccentOrange.rim,
  boxShadow: [
    `inset 0 1px 0 0 ${landingAccentOrange.insetHighlight}`,
    `inset 0 -1px 0 0 ${landingAccentOrange.insetShadow}`,
    "0 1px 0 rgba(255, 255, 255, 0.35)",
    "0 6px 14px rgba(154, 52, 18, 0.28)",
    "0 2px 4px rgba(0, 0, 0, 0.08)",
  ].join(", "),
};

export const SurfaceClassName = [
  "relative isolate overflow-hidden rounded-full",
  "border font-medium antialiased text-white shadow-md",
  "transition-[filter,opacity]",
  "before:pointer-events-none before:absolute before:inset-x-[12%] before:top-px before:z-[1] before:h-[42%] before:rounded-[999px]",
  "before:bg-gradient-to-b before:from-white/50 before:via-white/15 before:to-transparent",
  "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:top-[55%] after:rounded-b-full",
  "after:bg-gradient-to-t after:from-black/10 after:to-transparent",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
  "active:brightness-[0.97]",
  "disabled:cursor-not-allowed disabled:opacity-45",
].join(" ");
