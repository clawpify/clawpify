import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { containerChromeStyle } from "@/components/Container";
import { FeatureCard } from "./FeatureCard";
import type { FeatureCardVisual } from "../types";
import { landingPalette } from "../utils";

type FeaturesIntro = {
  readonly headline: string;
  readonly subline?: string;
};

type FeatureItem = {
  readonly title: string;
  readonly description: string;
  readonly ctaLabel: string;
  readonly visual: FeatureCardVisual;
  readonly ctaHref?: string;
};

type FeaturesSectionProps = {
  intro: FeaturesIntro;
  features: readonly FeatureItem[];
};

const mainClassName = [
  "relative z-10 mx-auto flex w-full flex-1 flex-col items-center",
  "overflow-hidden",
  "px-5 pb-16 pt-6 sm:px-8 sm:pb-16 sm:pt-8 md:px-10 md:pb-16 md:pt-10",
  "-mt-8 sm:-mt-10 md:-mt-12",
].join(" ");

export function FeaturesSection({ intro, features }: FeaturesSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.52"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [88, 0]);

  const scrollMotionStyle = reducedMotion ? undefined : { y };

  return (
    <motion.main
      ref={ref}
      id="features"
      className={mainClassName}
      style={{
        ...scrollMotionStyle,
        backgroundColor: landingPalette.pageBackground,
      }}
    >
      <LiquidGlassCard
        className="relative z-10 w-full max-w-7xl 2xl:max-w-screen-2xl"
        mode="prominent"
        overLight
      >
        <div
          className="relative isolate min-w-0 w-full rounded-3xl border px-8 py-[100px] text-zinc-900 md:px-10 lg:px-12"
          style={{
            ...containerChromeStyle,
            font: "inherit",
            textShadow: "none",
          }}
        >
          <header className="mb-10 max-w-3xl md:mb-12">
            <h2 className="landing-serif-headline text-2xl leading-[1.15] text-zinc-900 md:text-[1.75rem]">
              {intro.headline}
            </h2>
            {intro.subline ? (
              <p className="landing-sans-copy mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
                {intro.subline}
              </p>
            ) : null}
          </header>
          <div
            className={[
              "grid grid-cols-1 gap-7 md:grid-cols-3 md:gap-6 md:items-stretch",
              "lg:gap-7",
            ].join(" ")}
          >
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                visual={feature.visual}
                ctaLabel={feature.ctaLabel}
                ctaHref={feature.ctaHref}
              />
            ))}
          </div>
        </div>
      </LiquidGlassCard>
    </motion.main>
  );
}
