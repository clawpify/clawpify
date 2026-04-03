import type { CSSProperties } from "react";
import type { ButtonProps } from "../types";
import { landingAccentOrange } from "../utils";

export const landingOrangeBubbleStyle: CSSProperties = {
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

export const landingOrangeBubbleClassName = [
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

const heroSkyStyle = {
  background:
    "linear-gradient(180deg, #38bdf8 0%, #0ea5e9 35%, #0284c7 70%, #0369a1 100%)",
  borderColor: "rgba(14, 116, 185, 0.95)",
  boxShadow: [
    "inset 0 1px 0 0 rgba(255, 255, 255, 0.55)",
    "inset 0 -1px 0 0 rgba(0, 0, 0, 0.12)",
    "0 1px 0 rgba(255, 255, 255, 0.35)",
    "0 8px 22px rgba(3, 105, 161, 0.45)",
    "0 2px 6px rgba(0, 0, 0, 0.12)",
  ].join(", "),
} as const;

export function Button({
  className = "",
  children = "Download",
  disabled,
  type = "button",
  variant = "default",
  ...props
}: ButtonProps) {
  const isHero = variant === "heroSky";

  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        isHero ? "" : landingOrangeBubbleClassName,
        "landing-sans-copy min-w-[10rem] px-10 py-3",
        isHero
          ? [
              "relative isolate overflow-hidden rounded-full font-medium antialiased text-white",
              "border shadow-md transition-[filter,opacity]",
              "before:pointer-events-none before:absolute before:inset-x-[12%] before:top-px before:z-[1] before:h-[42%] before:rounded-[999px]",
              "before:bg-gradient-to-b before:from-white/50 before:via-white/15 before:to-transparent",
              "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:top-[55%] after:rounded-b-full",
              "after:bg-gradient-to-t after:from-black/10 after:to-transparent",
              "disabled:cursor-not-allowed disabled:opacity-45",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
              "active:brightness-[0.97]",
            ].join(" ")
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={isHero ? heroSkyStyle : landingOrangeBubbleStyle}
      {...props}
    >
      <span className="relative z-[2]">{children}</span>
    </button>
  );
}
