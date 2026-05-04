import type { ReactNode } from "react";

export type HeroProps = {
  className?: string;
};

export type InputProps = {
  className?: string;
};

export type ExploreAiIconProps = {
  name: LandingFooterExploreProviderKey;
  /** Override sizing (footer uses default; hero floats use larger) */
  iconClassName?: string;
};

export type HeroFloatingProductsProps = {
  className?: string;
};

export type HeroFloatItemConfig = {
  readonly key: string;
  readonly positionClass: string;
  readonly sizeClass: string;
  readonly productAsset: string;
  readonly imageSrc: string;
};

export type FeatureCardVisual = "inventoryBubbles" | "moneyMotif" | "channelLogos";

export type FeatureCardProps = {
  title: string;
  description: string;
  ctaLabel: string;
  visual: FeatureCardVisual;
  ctaHref?: string;
  className?: string;
};

export type FeaturesIntro = {
  readonly headline: string;
  readonly subline?: string;
};

export type FeatureItem = {
  readonly title: string;
  readonly description: string;
  readonly ctaLabel: string;
  readonly visual: FeatureCardVisual;
  readonly ctaHref?: string;
};

export type FeaturesSectionProps = {
  intro: FeaturesIntro;
  features: readonly FeatureItem[];
};

export type LandingFooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type LandingFooterNavColumn = {
  heading: string;
  links: readonly LandingFooterLink[];
};

export type LandingFooterExploreProviderKey =
  | "openai"
  | "perplexity"
  | "claude"
  | "gemini"
  | "grok";

export type LandingFooterExploreProvider = {
  key: LandingFooterExploreProviderKey;
  href: string;
  ariaLabel: string;
};

export type LandingFooterExploreWithAi = {
  label: string;
  providers: readonly LandingFooterExploreProvider[];
};

export type LandingFooterProps = {
  wordmark: string;
  tagline: string;
  copyright: string;
  navColumns: readonly LandingFooterNavColumn[];
  exploreWithAi: LandingFooterExploreWithAi;
  className?: string;
};

export type LandingSectionProps = {
  children: ReactNode;
  className?: string;
};
