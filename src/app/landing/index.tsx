import { Sidebar } from "./components/Sidebar";
import { Intro } from "./components/Intro";
import { Features } from "./components/Features";
import { Footer } from "./components/Footer";
import { copy } from "./utils/copy";

export function LandingPage() {
  return (
    <div className="landing flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <div className="hero-pattern shrink-0 px-6 pt-9 pb-[110px] md:px-10 md:pt-9 md:pb-[110px] lg:px-12">
          <h1 className="hero-headline max-w-4xl text-4xl font-medium leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl md:text-6xl lg:text-[4rem] xl:text-[4.5rem] 2xl:text-[5rem]">
            {copy.hero.headline}
          </h1>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Intro />
          <Features />
          <Footer />
        </main>
      </div>
    </div>
  );
}
