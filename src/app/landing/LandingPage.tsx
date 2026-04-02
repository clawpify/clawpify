import { FeaturesSection, Hero, LandingFooter } from "./components";
import { landingCopy, landingPalette } from "./utils";

export function LandingPage() {
  const { features, featuresIntro, footer } = landingCopy;

  return (
    <div
      className="landing flex min-h-screen flex-col"
      style={{ backgroundColor: landingPalette.pageBackground }}
      aria-label="Landing"
    >
      <Hero />
      <FeaturesSection intro={featuresIntro} features={features} />
      <LandingFooter
        wordmark={footer.wordmark}
        tagline={footer.tagline}
        copyright={footer.copyright}
        navColumns={footer.navColumns}
        exploreWithAi={footer.exploreWithAi}
      />
    </div>
  );
}
