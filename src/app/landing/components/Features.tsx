import { copy } from "../utils/copy";
import { FeatureCard } from "./FeatureCard";

export function Features() {
  return (
    <section id="features" className="flex flex-wrap items-center justify-center border-t border-zinc-200 bg-white py-24">
      <div className="grid w-full max-w-screen-2xl grid-cols-3 items-center justify-center gap-6 px-6 md:px-10 lg:px-12">
        {copy.features.map(({ title }) => (
          <FeatureCard key={title} title={title} />
        ))}
      </div>
    </section>
  );
}
