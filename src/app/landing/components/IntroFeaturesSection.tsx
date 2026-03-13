import { FeatureCard } from "./FeatureCard";

type IntroFeaturesSectionProps = {
  heading: string;
  paragraph: string;
  features: ReadonlyArray<{ title: string }>;
  sectionId?: string;
};

export function IntroFeaturesSection({
  heading,
  paragraph,
  features,
  sectionId,
}: IntroFeaturesSectionProps) {
  return (
    <>
      <section className="border-t border-zinc-200 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-6xl px-6 md:px-10 lg:px-12">
          <div className="grid gap-6 md:grid-cols-2 md:items-start md:gap-20">
            <h2 className="text-xl font-semibold leading-snug tracking-tight text-zinc-900 md:text-[1.5rem] lg:text-[1.75rem]">
              {heading}
            </h2>
            <p className="text-[0.9375rem] leading-relaxed text-zinc-600 md:text-[1rem]">
              {paragraph}
            </p>
          </div>
        </div>
      </section>
      <section
        id={sectionId}
        className="flex flex-wrap items-center justify-center border-t border-zinc-200 bg-[#f2f3f1] py-24"
      >
        <div className="grid w-full max-w-screen-2xl grid-cols-3 items-center justify-center gap-6 px-6 md:px-10 lg:px-12">
          {features.map(({ title }) => (
            <FeatureCard key={title} title={title} />
          ))}
        </div>
      </section>
    </>
  );
}
