import { Sidebar } from "./components/Sidebar";
import { IntroFeaturesSection } from "./components/IntroFeaturesSection";
import { Footer } from "./components/Footer";
import { copy } from "./utils/copy";

export function LandingPage() {
  return (
    <div className="landing flex min-h-screen bg-[#f2f3f1]">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <div className="hero-pattern shrink-0 px-6 pt-9 pb-[110px] md:px-10 md:pt-9 md:pb-[110px] lg:px-12">
          <h1 className="hero-headline max-w-4xl text-3xl font-medium leading-[1.1] tracking-tight text-zinc-900 sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4rem] 2xl:text-[4.5rem]">
            {copy.hero.headline}
          </h1>
        </div>
        <main className="flex-1 overflow-y-auto">
          <IntroFeaturesSection
            heading={copy.intro.heading}
            paragraph={copy.intro.paragraph}
            features={copy.features}
            sectionId="products"
          />
          <IntroFeaturesSection
            heading={copy.introAiSearch.heading}
            paragraph={copy.introAiSearch.paragraph}
            features={copy.featuresAiSearch}
            sectionId="ai-search"
          />
          <Footer />
        </main>
      </div>
    </div>
  );
}
