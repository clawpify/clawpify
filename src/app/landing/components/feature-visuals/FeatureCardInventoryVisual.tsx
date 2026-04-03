import { LANDING_INVENTORY_FEATURE_IMAGE_FILENAMES, landingPublicImageUrl } from "../../utils/heroFloatAssets";

const driftClass = ["landing-hero-float-bubble--a", "landing-hero-float-bubble--b", "landing-hero-float-bubble--c"] as const;

const RADIUS_X_PCT = 45;
const RADIUS_Y_PCT = 36;

const N = LANDING_INVENTORY_FEATURE_IMAGE_FILENAMES.length;

const RING_BUBBLES = Array.from({ length: N }, (_, i) => {
  const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
  const leftPct = 50 + Math.cos(angle) * RADIUS_X_PCT;
  const topPct = 50 + Math.sin(angle) * RADIUS_Y_PCT;
  const z = 10 + Math.round(Math.sin(angle) * 6);
  const opacity = 0.74 + ((Math.sin(angle) + 1) / 2) * 0.22;
  return { leftPct, topPct, z, opacity, fileIndex: i };
});

export function FeatureCardInventoryVisual() {
  return (
    <div aria-hidden className="relative h-[176px] w-full overflow-hidden md:h-[200px]">
      {RING_BUBBLES.map((b, idx) => {
        const name = LANDING_INVENTORY_FEATURE_IMAGE_FILENAMES[b.fileIndex]!;
        const src = landingPublicImageUrl(name);
        const isPrimary = idx === 0;
        const sizeClass = isPrimary
          ? "h-[64px] w-[64px] md:h-[74px] md:w-[74px]"
          : "h-[58px] w-[58px] md:h-[68px] md:w-[68px]";
        return (
          <div
            key={`bubble-${name}-${idx}`}
            className={["pointer-events-none absolute", sizeClass].join(" ")}
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
                driftClass[idx % driftClass.length],
              ].join(" ")}
              data-hero-product={name}
            >
              <img className="landing-glass-sphere__meme-media" src={src} alt="" loading="lazy" decoding="async" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
