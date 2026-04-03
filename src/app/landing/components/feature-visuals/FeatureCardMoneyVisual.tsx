import { landingPublicImageUrl } from "../../utils/heroFloatAssets";

const dollarsSrc = landingPublicImageUrl("dollars.png");
const coinSrc = landingPublicImageUrl("product-coin.png");

const driftClass = ["landing-hero-float-bubble--a", "landing-hero-float-bubble--b", "landing-hero-float-bubble--c"] as const;

const COINS: readonly {
  readonly left: string;
  readonly top: string;
  readonly size: number;
  readonly rotate: number;
  readonly opacity: number;
  readonly z: number;
}[] = [
  { left: "7%", top: "16%", size: 34, rotate: -16, opacity: 0.95, z: 1 },
  { left: "3%", top: "46%", size: 28, rotate: 14, opacity: 0.86, z: 0 },
  { left: "11%", top: "74%", size: 36, rotate: -10, opacity: 0.92, z: 2 },
  { left: "24%", top: "7%", size: 26, rotate: 20, opacity: 0.72, z: 0 },
  { left: "79%", top: "11%", size: 34, rotate: -12, opacity: 0.93, z: 1 },
  { left: "92%", top: "36%", size: 30, rotate: 9, opacity: 0.88, z: 0 },
  { left: "86%", top: "70%", size: 38, rotate: -18, opacity: 0.94, z: 2 },
  { left: "71%", top: "84%", size: 24, rotate: 15, opacity: 0.68, z: 1 },
  { left: "46%", top: "3%", size: 22, rotate: -7, opacity: 0.64, z: 0 },
  { left: "54%", top: "90%", size: 28, rotate: 11, opacity: 0.82, z: 1 },
];

export function FeatureCardMoneyVisual() {
  return (
    <div aria-hidden className="relative flex h-[176px] w-full items-center justify-center overflow-hidden md:h-[200px]">
      {COINS.map((c, i) => (
        <div
          key={i}
          className="pointer-events-none absolute"
          style={{
            left: c.left,
            top: c.top,
            width: c.size,
            height: c.size,
            opacity: c.opacity,
            zIndex: c.z,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className={`h-full w-full ${driftClass[i % driftClass.length]}`}>
            <img
              src={coinSrc}
              alt=""
              className="h-full w-full object-contain drop-shadow-sm"
              style={{ transform: `rotate(${c.rotate}deg)` }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      ))}
      <div className="relative z-[3] flex h-full w-full items-center justify-center px-1">
        <img
          src={dollarsSrc}
          alt=""
          className="max-h-full max-w-[min(100%,280px)] object-contain object-center md:max-w-[min(100%,320px)]"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}
