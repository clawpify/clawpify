import { Link } from "react-router-dom";
import type { FeatureCardProps, FeatureCardVisual } from "../types";
import { landingOrangeBubbleClassName, landingOrangeBubbleStyle } from "./Button";
import { FeatureCardChannelsVisual } from "./feature-visuals/FeatureCardChannelsVisual";
import { FeatureCardInventoryVisual } from "./feature-visuals/FeatureCardInventoryVisual";
import { FeatureCardMoneyVisual } from "./feature-visuals/FeatureCardMoneyVisual";

function FeatureCardVisualSlot({ visual }: { visual: FeatureCardVisual }) {
  switch (visual) {
    case "inventoryBubbles":
      return <FeatureCardInventoryVisual />;
    case "moneyMotif":
      return <FeatureCardMoneyVisual />;
    case "channelLogos":
      return <FeatureCardChannelsVisual />;
  }
}

export function FeatureCard({
  title,
  description,
  visual,
  ctaLabel,
  ctaHref,
  className = "",
}: FeatureCardProps) {
  return (
    <article
      className={[
        "flex h-full flex-col rounded-xl border border-zinc-200/90 bg-white px-5 pb-6 pt-6 md:px-6 md:pt-7",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h2 className="landing-serif-headline text-lg leading-snug text-zinc-900 md:text-xl">{title}</h2>
      <p className="landing-sans-copy mt-2 text-sm leading-relaxed text-zinc-600">{description}</p>

      <div className="mt-5 shrink-0 overflow-hidden rounded-2xl border border-zinc-200/70 bg-zinc-100/90 md:mt-6">
        <FeatureCardVisualSlot visual={visual} />
      </div>

      <div className="mt-5 md:mt-auto md:pt-6">
        {ctaHref ? (
          <Link
            to={ctaHref}
            className={[
              landingOrangeBubbleClassName,
              "landing-sans-copy flex w-full items-center justify-center px-6 py-3 text-center text-sm no-underline",
            ].join(" ")}
            style={landingOrangeBubbleStyle}
          >
            <span className="relative z-[2]">{ctaLabel}</span>
          </Link>
        ) : (
          <span
            aria-disabled
            className={[
              landingOrangeBubbleClassName,
              "landing-sans-copy inline-flex w-full cursor-default select-none items-center justify-center px-6 py-3 text-center text-sm",
            ].join(" ")}
            style={landingOrangeBubbleStyle}
          >
            <span className="relative z-[2]">{ctaLabel}</span>
          </span>
        )}
      </div>
    </article>
  );
}
