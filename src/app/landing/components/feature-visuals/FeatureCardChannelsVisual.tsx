import ebayBrand from "../../assets/brands/ebay.svg";
import etsyBrand from "../../assets/brands/etsy.svg";
import facebookBrand from "../../assets/brands/facebook.svg";
import shopifyBrand from "../../assets/brands/shopify.svg";
import { landingPublicImageUrl } from "../../utils/heroFloatAssets";

const mactintoshSrc = landingPublicImageUrl("mactintosh.png");

const CHANNELS = [
  { src: facebookBrand, label: "Facebook" },
  { src: etsyBrand, label: "Etsy" },
  { src: shopifyBrand, label: "Shopify" },
  { src: ebayBrand, label: "eBay" },
] as const;

const BRANCH_Y = [18, 39, 61, 82] as const;
const curve = 7;
const branchX2 = 69;
const junctionX = 46;
const trunkStartX = 31;

const dashedLine = {
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "butt" as const,
  strokeLinejoin: "round" as const,
  strokeDasharray: "2.75 2.75" as const,
  vectorEffect: "nonScalingStroke" as const,
};

export function FeatureCardChannelsVisual() {
  const [y0, y1, y2, y3] = BRANCH_Y;
  const trunkH = `M ${trunkStartX} 50 H ${junctionX}`;
  const trunkV = `M ${junctionX} ${y0} L ${junctionX} ${y3}`;
  const branchDs = [
    `M ${junctionX} ${y0} Q ${58} ${y0 - curve} ${72} ${y0} H ${branchX2}`,
    `M ${junctionX} ${y1} H ${branchX2}`,
    `M ${junctionX} ${y2} H ${branchX2}`,
    `M ${junctionX} ${y3} Q ${58} ${y3 + curve} ${72} ${y3} H ${branchX2}`,
  ];

  return (
    <div aria-hidden className="relative h-[176px] w-full overflow-hidden md:h-[200px]">
      <div className="flex h-full w-full items-center justify-center">
        <div className="relative aspect-square h-full max-h-full w-auto max-w-full">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full text-zinc-300"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            shapeRendering="geometricPrecision"
            fill="none"
            aria-hidden
          >
            <path d={trunkH} {...dashedLine} />
            <path d={trunkV} {...dashedLine} />
            {branchDs.map((d, i) => (
              <path key={CHANNELS[i]!.label} d={d} {...dashedLine} />
            ))}
          </svg>

          <div
            className={[
              "pointer-events-none absolute left-[22%] top-1/2 z-[2] h-12 w-12 -translate-x-1/2 -translate-y-1/2",
              "md:h-[54px] md:w-[54px]",
            ].join(" ")}
          >
            <div
              className="landing-glass-sphere landing-glass-sphere--meme landing-hero-float-bubble--a block h-full w-full rounded-full"
              data-hero-product="mactintosh.png"
            >
              <img
                className="landing-glass-sphere__meme-media"
                src={mactintoshSrc}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {CHANNELS.map((ch, i) => (
            <div
              key={ch.label}
              className={[
                "pointer-events-none absolute right-[6%] z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center",
                "rounded-xl border border-zinc-200/90 bg-white shadow-sm md:h-10 md:w-10 md:rounded-2xl",
              ].join(" ")}
              style={{ top: `${BRANCH_Y[i]!}%` }}
            >
              <img
                src={ch.src}
                alt=""
                className="h-5 w-5 object-contain md:h-6 md:w-6"
                width={24}
                height={24}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
