import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FeatureCard } from "./FeatureCard";

function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4a9" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function OpenAIBadge() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="#1d1d1f" aria-hidden>
      <path d="M22.28 9.82a5.98 5.98 0 00-.52-4.91 6.05 6.05 0 00-6.51-2.9A6.07 6.07 0 004.98 4.18a5.98 5.98 0 00-4 2.9 6.05 6.05 0 00.74 7.1 5.98 5.98 0 00.51 4.91 6.05 6.05 0 006.52 2.9A5.98 5.98 0 0013.26 24a6.06 6.06 0 005.77-4.21 5.99 5.99 0 004-2.9 6.06 6.06 0 00-.75-7.07zM13.26 22.43a4.48 4.48 0 01-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 00.39-.68v-6.74l2.02 1.17a.07.07 0 01.04.05v5.58a4.5 4.5 0 01-4.49 4.5zM3.6 18.3a4.47 4.47 0 01-.54-3.01l.14.08 4.78 2.76a.77.77 0 00.78 0l5.84-3.37v2.33a.08.08 0 01-.03.06l-4.84 2.79a4.5 4.5 0 01-6.13-1.64zM2.34 7.9a4.49 4.49 0 012.37-1.98v5.68a.77.77 0 00.39.68l5.82 3.36-2.02 1.17a.08.08 0 01-.07 0l-4.83-2.79A4.5 4.5 0 012.34 7.9zm16.6 3.86l-5.83-3.39 2.02-1.16a.08.08 0 01.07 0l4.83 2.79a4.49 4.49 0 01-.68 8.1V12.43a.79.79 0 00-.41-.67zm2.01-3.02l-.14-.09-4.78-2.78a.78.78 0 00-.78 0l-5.84 3.37V6.9a.07.07 0 01.03-.06l4.83-2.79a4.5 4.5 0 016.68 4.66zM8.31 12.87l-2.02-1.16a.08.08 0 01-.04-.06V6.08a4.5 4.5 0 017.38-3.46l-.14.08-4.78 2.76a.8.8 0 00-.4.68zm1.1-2.37l2.6-1.5 2.61 1.5v3l-2.6 1.5-2.61-1.5z" />
    </svg>
  );
}

function GeminiBadge() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="#8e75b2" aria-hidden>
      <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" />
    </svg>
  );
}

function ClaudeBadge() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="#d97757" aria-hidden>
      <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
    </svg>
  );
}

const STACKED_CARDS = [
  { image: "/image/product-headphones.png", name: "Wireless Headphones", price: "$79", badge: ClaudeBadge, rotate: 5, x: 40, z: 1 },
  { image: "/image/product-wallet.png", name: "Leather Card Wallet", price: "$55", badge: GeminiBadge, rotate: -3, x: -30, z: 2 },
  { image: "/image/product-toy.png", name: "Wooden Block Set", price: "$32", badge: OpenAIBadge, rotate: 0, x: 4, z: 3 },
] as const;

const META_CHECKS = ["Title", "Tags", "Schema"] as const;

const GRID_BG = `url("data:image/svg+xml,${encodeURIComponent('<svg width="957" height="480" viewBox="0 0 957 480" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#c)"><rect x="-210.11" y="1.586" width="1377" height="477" stroke="#bbb" stroke-width=".75"/><path d="M1008.45 54.572H-210.213" stroke="#bbb" stroke-width=".75"/><path d="M1008.45 107.523H-210.213" stroke="#bbb" stroke-width=".75"/><path d="M1008.45 160.535H-210.213" stroke="#bbb" stroke-width=".75"/><path d="M1008.45 266.494H-210.213" stroke="#bbb" stroke-width=".75"/><path d="M1008.45 319.479H-210.213" stroke="#bbb" stroke-width=".75"/><path d="M1008.45 372.273H-210.213" stroke="#bbb" stroke-width=".75"/><path d="M1008.45 425.449H-210.213" stroke="#bbb" stroke-width=".75"/><path d="M2.14 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M54.64 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M107.89 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M160.39 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M213.64 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M266.89 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M320.14 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M372.64 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M425.89 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M478.39 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M531.64 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M584.132 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M638.132 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M690.632 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M743.882 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M796.382 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M849.633 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M902.133 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M955.383 1.586v477" stroke="#bbb" stroke-width=".75"/><path d="M1166.9 213.836H-210.098" stroke="#bbb" stroke-width=".75"/></g><defs><clipPath id="c"><rect width="956.25" height="478.5" fill="white" transform="translate(.537 .75)"/></clipPath></defs></svg>')}")`;

const INSIGHT_AGENT_ROWS = [
  { name: "OpenAI", status: "You rank #2", accent: "bg-[#1d1d1f]" },
  { name: "Perplexity", status: "Competitor leads", accent: "bg-[#1a7dbb]" },
  { name: "Gemini", status: "Missing in results", accent: "bg-[#8e75b2]" },
] as const;

const INSIGHT_ACTIONS = [
  "Add comparison-friendly product copy",
  "Strengthen schema for key prompts",
  "Publish landing pages for agent queries",
] as const;

function ProductMetaMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [topCard, setTopCard] = useState<string | null>(null);

  const maxZ = STACKED_CARDS.length + 1;

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[20rem] md:min-h-[28rem] overflow-hidden bg-white"
      style={{ backgroundImage: GRID_BG, backgroundSize: "cover", backgroundPosition: "center" }}
      aria-hidden
    >
      {STACKED_CARDS.map((card) => {
        const Badge = card.badge;
        const isTop = topCard === card.image;
        return (
          <motion.div
            key={card.image}
            drag
            dragConstraints={containerRef}
            dragMomentum={false}
            onDragStart={() => setTopCard(card.image)}
            whileDrag={{ scale: 1.05 }}
            className="absolute left-1/2 -ml-[5rem] md:-ml-[7rem] bottom-4 md:bottom-10 w-40 md:w-56 overflow-hidden bg-white border border-black/10 shadow-sm cursor-grab active:cursor-grabbing"
            style={{
              x: card.x,
              rotate: card.rotate,
              zIndex: isTop ? maxZ : card.z,
            }}
          >
            <img src={card.image} alt="" className="h-28 md:h-44 w-full object-cover pointer-events-none" />
            <div className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center bg-white/90 shadow-sm backdrop-blur-sm">
              <Badge />
            </div>
            <div className="px-3 pt-2.5 pb-1">
              <div className="flex items-baseline justify-between">
                <span className="truncate text-[0.78rem] font-medium text-[#1d1d1f]">
                  {card.name}
                </span>
                <span className="ml-2 shrink-0 font-mono text-[0.7rem] font-semibold text-[#1d1d1f]">
                  {card.price}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 px-3 pb-2.5">
              {META_CHECKS.map((label) => (
                <div key={label} className="flex items-center gap-1.5">
                  <CheckIcon />
                  <span className="font-mono text-[0.58rem] uppercase tracking-wider text-[#888]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function InsightsMockup() {
  return (
    <div
      className="relative h-full min-h-[20rem] overflow-hidden bg-white p-4 md:min-h-[28rem] md:p-6"
      style={{ backgroundImage: GRID_BG, backgroundSize: "cover", backgroundPosition: "center" }}
      aria-hidden
    >
      <div className="mx-auto flex h-full max-w-[30rem] flex-col justify-center gap-3">
        <div className="border border-black/10 bg-white p-3 shadow-sm md:p-4">
          <div className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[#888]">
            Prompt
          </div>
          <div className="text-sm font-medium leading-relaxed text-[#1d1d1f] md:text-[0.95rem]">
            best noise cancelling headphones for remote work
          </div>
        </div>

        <div className="border border-black/10 bg-white p-3 shadow-sm md:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[#888]">
              AI Search Analysis
            </span>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#1d1d1f]">
              3 Models
            </span>
          </div>
          <div className="space-y-2">
            {INSIGHT_AGENT_ROWS.map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-3 border border-black/10 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${row.accent}`} />
                  <span className="text-[0.72rem] font-medium text-[#1d1d1f] md:text-[0.78rem]">
                    {row.name}
                  </span>
                </div>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#666]">
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-black/10 bg-white p-3 shadow-sm md:p-4">
          <div className="mb-3 font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[#888]">
            Actionable Insights
          </div>
          <div className="space-y-2">
            {INSIGHT_ACTIONS.map((action) => (
              <div key={action} className="flex items-start gap-2">
                <CheckIcon />
                <span className="text-[0.72rem] leading-relaxed text-[#1d1d1f] md:text-[0.78rem]">
                  {action}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type Feature = {
  label?: string;
  title: string;
  description?: string;
};

type IntroFeaturesSectionProps = {
  heading: string;
  paragraph: string;
  features: ReadonlyArray<Feature>;
  sectionId?: string;
  panelLabel?: string;
  image?: string;
  imageAlt?: string;
  mockup?: boolean;
  mockupVariant?: "products" | "insights";
  ctaLabel?: string;
  ctaHref?: string;
};

export function IntroFeaturesSection({
  heading,
  paragraph,
  features,
  sectionId,
  panelLabel,
  image,
  imageAlt,
  mockup,
  mockupVariant,
  ctaLabel,
  ctaHref,
}: IntroFeaturesSectionProps) {
  const usesPanelLayout = Boolean(image || mockup || mockupVariant);
  const resolvedMockupVariant = mockupVariant ?? (mockup ? "products" : undefined);

  if (usesPanelLayout) {
    return (
      <section id={sectionId} className="border-t border-zinc-200 bg-[#f2f3f1]">
        <div className="mx-auto max-w-screen-2xl px-5 md:px-8 lg:px-10 py-10 md:py-16">
          <div className="border border-black/10 bg-white shadow-sm">
            {/* Title bar */}
            <div className="flex items-center gap-2.5 border-b border-black/10 bg-[#f5f5f5] px-4 py-2.5">
              <div className="hero-model-label__dots" aria-hidden>
                <span className="hero-model-label__dot hero-model-label__dot--red" />
                <span className="hero-model-label__dot hero-model-label__dot--yellow" />
                <span className="hero-model-label__dot hero-model-label__dot--green" />
              </div>
              <span className="font-mono text-[0.68rem] font-medium uppercase tracking-widest text-[#555]">
                {panelLabel ?? "Products"}
              </span>
            </div>

            {/* Top: heading + image side by side */}
            <div className="grid md:grid-cols-2 md:items-stretch">
              <div className="flex flex-col justify-center gap-5 p-8 md:p-12 lg:p-16">
                <h2 className="text-2xl font-semibold leading-snug tracking-tight text-[#1d1d1f] md:text-3xl lg:text-4xl">
                  {heading}
                </h2>
                <p className="text-[0.8rem] leading-relaxed text-[#555] md:text-[0.85rem] max-w-md">
                  {paragraph}
                </p>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-black/10">
                {resolvedMockupVariant === "products" ? (
                  <ProductMetaMockup />
                ) : resolvedMockupVariant === "insights" ? (
                  <InsightsMockup />
                ) : (
                  <img
                    src={image}
                    alt={imageAlt ?? ""}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>

            {/* Bottom: 3-col feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 border-t border-black/10">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className={i > 0 ? "border-t md:border-t-0 md:border-l border-black/10" : ""}
                >
                  <FeatureCard
                    label={feature.label}
                    title={feature.title}
                    description={feature.description}
                    compact
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id={sectionId} className="border-t border-zinc-200 pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="max-w-6xl px-5 md:px-8 lg:px-10">
          <div className="grid gap-5 md:grid-cols-2 md:items-start md:gap-16">
            <h2 className="text-lg font-semibold leading-snug tracking-tight text-zinc-900 md:text-[1.2rem] lg:text-[1.4rem]">
              {heading}
            </h2>
            <p className="text-[0.75rem] leading-relaxed text-zinc-600 md:text-[0.8rem]">
              {paragraph}
            </p>
          </div>
        </div>
      </section>
      <section
        className="flex flex-wrap items-center justify-center border-t border-zinc-200 bg-[#f2f3f1] py-20"
      >
        <div className="grid w-full max-w-screen-2xl grid-cols-3 items-center justify-center gap-5 px-5 md:px-8 lg:px-10">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              label={feature.label}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>
    </>
  );
}
