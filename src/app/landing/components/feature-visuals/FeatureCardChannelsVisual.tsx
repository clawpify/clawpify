import ebayBrand from "../../assets/brands/ebay.svg";
import etsyBrand from "../../assets/brands/etsy.svg";
import facebookBrand from "../../assets/brands/facebook.svg";
import shopifyBrand from "../../assets/brands/shopify.svg";

const driftClass = ["landing-hero-float-bubble--a", "landing-hero-float-bubble--b", "landing-hero-float-bubble--c"] as const;

const BUBBLES = [
  { src: facebookBrand, label: "Facebook", leftPct: 22, topPct: 28, z: 12, opacity: 0.84 },
  { src: etsyBrand, label: "Etsy", leftPct: 78, topPct: 34, z: 9, opacity: 0.8 },
  { src: shopifyBrand, label: "Shopify", leftPct: 34, topPct: 72, z: 11, opacity: 0.78 },
  { src: ebayBrand, label: "eBay", leftPct: 70, topPct: 68, z: 10, opacity: 0.86 },
] as const;

export function FeatureCardChannelsVisual() {
  return (
    <div aria-hidden className="relative h-[176px] w-full overflow-hidden md:h-[200px]">
      {BUBBLES.map((b, i) => (
        <div
          key={b.label}
          className="pointer-events-none absolute h-[58px] w-[58px] md:h-[68px] md:w-[68px]"
          style={{
            left: `${b.leftPct}%`,
            top: `${b.topPct}%`,
            opacity: b.opacity,
            zIndex: b.z,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className={[
              "landing-glass-sphere block h-full w-full rounded-full",
              "landing-glass-sphere--meme",
              driftClass[i % driftClass.length],
            ].join(" ")}
            data-hero-product={b.label}
          >
            <img className="landing-glass-sphere__meme-media" src={b.src} alt="" loading="lazy" decoding="async" />
          </div>
        </div>
      ))}
    </div>
  );
}
