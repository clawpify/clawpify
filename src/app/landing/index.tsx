import { useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { HeroSearchSection } from "./components/HeroSearchSection";
import { IntroFeaturesSection } from "./components/IntroFeaturesSection";
import { FAQSection } from "./components/FAQSection";
import { Footer } from "./components/Footer";
import { copy } from "./utils/copy";
import { useScrollProgress } from "./hooks/useScrollProgress";

export function LandingPage() {
  const scrollRef = useRef<HTMLElement | null>(null);
  const progress = useScrollProgress(scrollRef);

  return (
    <div className="landing flex h-screen overflow-hidden bg-[#f2f3f1]">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <main ref={scrollRef} className="hero-pattern flex-1 overflow-y-auto">
          <HeroSearchSection progress={progress} demo={copy.hero.heroDemo} />
          <IntroFeaturesSection
            heading={copy.intro.heading}
            paragraph={copy.intro.paragraph}
            features={copy.features}
            sectionId="products"
            mockup
            ctaLabel={copy.intro.ctaLabel}
            ctaHref={copy.intro.ctaHref}
          />
          <IntroFeaturesSection
            heading={copy.introAiSearch.heading}
            paragraph={copy.introAiSearch.paragraph}
            features={copy.featuresAiSearch}
            sectionId="insights"
            panelLabel={copy.introAiSearch.panelLabel}
            mockupVariant="insights"
          />
          <FAQSection />
          <Footer />
        </main>
      </div>
    </div>
  );
}
