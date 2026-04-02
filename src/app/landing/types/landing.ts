import type { ReactNode } from "react";

export type HeroProps = {
  className?: string;
};

export type FeatureCardProps = {
  title: string;
  description: string;
  ctaLabel: string;
  /** When omitted, CTA is visual-only (no navigation). */
  ctaHref?: string;
  className?: string;
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
