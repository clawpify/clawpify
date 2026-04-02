import { useAuth } from "@clerk/react";
import { Link, useNavigate } from "react-router-dom";
import type { HeroProps } from "../types";
import { landingCopy, landingPalette } from "../utils";
import { Button, landingOrangeBubbleClassName, landingOrangeBubbleStyle } from "./Button";
import { HeroFloatingProducts } from "./HeroFloatingProducts";

export function Hero({ className = "" }: HeroProps) {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { hero, nav } = landingCopy;

  return (
    <section
      className={["landing-hero-band relative w-full overflow-x-clip", className].filter(Boolean).join(" ")}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: landingPalette.pageBackground }}
      />

      <header
        className={[
          "relative mx-auto flex w-full max-w-4xl flex-col items-center px-5 pb-32 pt-16 text-center sm:pb-36 sm:pt-20",
          "min-h-[min(128vh,1240px)] md:min-h-[min(156vh,1560px)] md:px-8 md:pb-40 md:pt-24",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <HeroFloatingProducts className="relative h-full min-h-[560px] w-full md:min-h-[680px]" />
        </div>

        <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
          <h1 className="landing-serif-headline landing-hero-headline max-w-3xl text-balance text-4xl leading-[1.08] text-zinc-900 md:text-5xl md:leading-[1.05] lg:text-6xl">
            {hero.headline}
          </h1>
          <p className="landing-sans-copy mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 md:mt-6 md:text-lg">
            {hero.subline}
          </p>
          <div className="mt-10 flex min-h-[3.25rem] flex-wrap items-center justify-center gap-4 md:mt-12">
            {!isLoaded ? (
              <Button type="button" disabled className="pointer-events-none opacity-60" aria-busy>
                {hero.ctaLabel}
              </Button>
            ) : isSignedIn ? (
              <Button type="button" onClick={() => navigate("/app")}>
                {nav.signedInCtaLabel}
              </Button>
            ) : (
              <Link
                to="/sign-in"
                className={[
                  landingOrangeBubbleClassName,
                  "landing-sans-copy inline-flex min-w-[10rem] items-center justify-center px-10 py-3 text-center no-underline",
                ].join(" ")}
                style={landingOrangeBubbleStyle}
              >
                <span className="relative z-[2]">{hero.ctaLabel}</span>
              </Link>
            )}
          </div>
        </div>
      </header>
    </section>
  );
}
