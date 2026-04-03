import { useAuth } from "@clerk/react";
import type { HeroProps } from "../types";
import { landingCopy, landingPalette } from "../utils";
import { Button } from "./Button";
import { HeroFloatingProducts } from "./HeroFloatingProducts";
import { Input } from "./Input";

export function Hero({ className = "" }: HeroProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { hero } = landingCopy;

  const heroMinHeight = [
    "min-h-[min(64vh,620px)]",
    "md:min-h-[min(78vh,780px)]",
  ].join(" ");

  // const authControls = !isLoaded ? (
  //   <Button type="button" disabled className="pointer-events-none min-w-0 px-6 py-2 text-sm opacity-60" aria-busy>
  //     {hero.ctaLabel}
  //   </Button>
  // ) : isSignedIn ? (
  //   <UserButton afterSignOutUrl="/" />
  // ) : (
  //   <SignInButton mode="redirect" forceRedirectUrl="/app">
  //     <Button type="button" className="min-w-0 px-6 py-2 text-sm">
  //       {hero.ctaLabel}
  //     </Button>
  //   </SignInButton>
  // );

  return (
    <section
      className={["landing-hero-band relative flex w-full flex-col overflow-x-clip", heroMinHeight, className].filter(Boolean).join(" ")}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: landingPalette.pageBackground }}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <HeroFloatingProducts className="relative h-full min-h-[280px] w-full md:min-h-[340px]" />
      </div>

      {/* <div className="pointer-events-auto absolute right-4 top-4 z-20 flex items-center gap-2 md:right-8 md:top-5">
        {authControls}
      </div> */}

      <header
        className={[
          "relative mx-auto flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:py-20 md:px-8 md:py-24",
          "w-full max-w-4xl",
        ].join(" ")}
      >
        <div className="relative z-10 flex w-full flex-col items-center">
          <div className="flex w-full max-w-3xl flex-col items-center">
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
                  <Input />
                </>
              ) : (
                <Input />
              )}
            </div>
          </div>
        </div>
      </header>
    </section>
  );
}
