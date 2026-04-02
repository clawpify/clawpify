import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { landingPalette } from "../utils";
import { FeatureCard } from "./FeatureCard";

type FeaturesIntro = {
  readonly headline: string;
  readonly subline?: string;
};

type FeatureItem = {
  readonly title: string;
  readonly description: string;
  readonly ctaLabel: string;
  readonly ctaHref?: string;
};

type FeaturesSectionProps = {
  intro: FeaturesIntro;
  features: readonly FeatureItem[];
};

const mainClassName = [
  "relative z-10 mx-auto -mt-10 sm:-mt-12 md:-mt-14 w-full max-w-5xl flex-1 rounded-t-2xl border px-5 pb-14 pt-14 md:px-8 md:pb-14 md:pt-16",
].join(" ");

const panelStyle = {
  background: landingPalette.mainPanel.background,
  borderColor: landingPalette.mainPanel.border,
  boxShadow: landingPalette.mainPanel.boxShadow,
} as const;

export function FeaturesSection({ intro, features }: FeaturesSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.52"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [88, 0]);

  const scrollMotionStyle = reducedMotion ? panelStyle : { ...panelStyle, y };

  return (
    <motion.main
      ref={ref}
      id="features"
      className={mainClassName}
      style={scrollMotionStyle}
    >
      <header className="mb-10 max-w-3xl">
        <h2 className="landing-serif-headline text-2xl leading-[1.15] text-zinc-900 md:text-[1.75rem]">
          {intro.headline}
        </h2>
        {intro.subline ? (
          <p className="landing-sans-copy mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
            {intro.subline}
          </p>
        ) : null}
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5">
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            ctaLabel={feature.ctaLabel}
            ctaHref={feature.ctaHref}
          />
        ))}
      </div>
    </motion.main>
  );
}
