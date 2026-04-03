import { useAuth } from "@clerk/react";
import { Link } from "react-router-dom";
import type { HeroProps } from "../types";
import { landingCopy, landingPalette } from "../utils";
import { Button } from "./Button";
import { HeroFloatingProducts } from "./HeroFloatingProducts";
import { Input } from "./Input";

export function Hero({ className = "" }: HeroProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { hero, heroWaitlist } = landingCopy;

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
          "relative mx-auto flex w-full max-w-4xl flex-col items-center px-5 pb-8 pt-4 text-center sm:pb-9 sm:pt-5",
          "min-h-[min(32vh,310px)] md:min-h-[min(39vh,390px)] md:px-8 md:pb-10 md:pt-6",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <HeroFloatingProducts className="relative h-full min-h-[140px] w-full md:min-h-[170px]" />
        </div>

        <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
          <h1 className="landing-serif-headline landing-hero-headline max-w-3xl text-balance text-4xl leading-[1.08] text-zinc-900 md:text-5xl md:leading-[1.05] lg:text-6xl">
            {hero.headline}
          </h1>
          <p className="landing-sans-copy mt-1 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 md:mt-1.5 md:text-lg">
            {hero.subline}
          </p>
          <div className="mt-2.5 flex min-h-[3.25rem] flex-wrap items-center justify-center gap-4 md:mt-3">
            {!isLoaded ? (
              <Button type="button" disabled className="pointer-events-none opacity-60" aria-busy>
                {hero.ctaLabel}
              </Button>
            ) : isSignedIn ? (
              <>
                {/* Open app CTA removed from hero; use site nav to reach the app. */}
                {/* <Button type="button" onClick={() => navigate("/app")}>
                  {landingCopy.nav.signedInCtaLabel}
                </Button> */}
                <Input />
              </>
            ) : (
              <div className="flex w-full flex-col items-center gap-3">
                <Input />
                <Link
                  to="/sign-in"
                  className="landing-sans-copy text-sm text-zinc-600 underline decoration-zinc-400 underline-offset-4 transition-colors hover:text-zinc-900"
                >
                  {heroWaitlist.signInPrompt}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </section>
  );
}
