import { Link } from "react-router-dom";
import type { FeatureCardProps } from "../types";
import { landingOrangeBubbleClassName, landingOrangeBubbleStyle } from "./Button";

export function FeatureCard({
  title,
  description,
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

      <div className="mt-8 md:mt-auto md:pt-8">
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
