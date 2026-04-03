import { heroFloatItems } from "../utils/heroFloatAssets";

type HeroFloatingProductsProps = {
  className?: string;
};

const driftClass = ["landing-hero-float-bubble--a", "landing-hero-float-bubble--b", "landing-hero-float-bubble--c"] as const;

export function HeroFloatingProducts({ className = "" }: HeroFloatingProductsProps) {
  return (
    <div className={["pointer-events-none absolute inset-0", className].filter(Boolean).join(" ")}>
      {heroFloatItems.map((item, index) => (
        <div
          key={item.key}
          className={["absolute", item.positionClass, item.sizeClass].join(" ")}
          aria-hidden
        >
          <div
            className={[
              "landing-glass-sphere block h-full w-full rounded-full",
              "landing-glass-sphere--meme",
              driftClass[index % driftClass.length],
            ]
              .filter(Boolean)
              .join(" ")}
            data-hero-product={item.productAsset}
          >
            <img
              className="landing-glass-sphere__meme-media"
              src={item.imageSrc}
              alt=""
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
