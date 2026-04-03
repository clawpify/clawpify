import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  displacementMap,
  polarDisplacementMap,
  prominentDisplacementMap,
} from "@/components/liquidGlassDisplacementMaps";

export type LiquidGlassCardMode = "standard" | "polar" | "prominent";

function mapHref(mode: LiquidGlassCardMode): string {
  switch (mode) {
    case "standard":
      return displacementMap;
    case "polar":
      return polarDisplacementMap;
    case "prominent":
      return prominentDisplacementMap;
    default:
      return displacementMap;
  }
}

type GlassFilterProps = {
  id: string;
  displacementScale: number;
  aberrationIntensity: number;
  width: number;
  height: number;
  mode: LiquidGlassCardMode;
};

function GlassFilter({
  id,
  displacementScale,
  aberrationIntensity,
  width,
  height,
  mode,
}: GlassFilterProps) {
  const href = mapHref(mode);
  const edgeStop = `${Math.max(30, 80 - aberrationIntensity * 2)}%`;
  const baseScale = -displacementScale;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-hidden"
      width={width}
      height={height}
    >
      <defs>
        <radialGradient id={`${id}-edge-mask`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="black" stopOpacity="0" />
          <stop offset={edgeStop} stopColor="black" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </radialGradient>
        <filter id={id} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feImage
            x="0"
            y="0"
            width="100%"
            height="100%"
            result="DISPLACEMENT_MAP"
            href={href}
            preserveAspectRatio="xMidYMid slice"
          />
          <feColorMatrix
            in="DISPLACEMENT_MAP"
            type="matrix"
            values="0.3 0.3 0.3 0 0
                    0.3 0.3 0.3 0 0
                    0.3 0.3 0.3 0 0
                    0 0 0 1 0"
            result="EDGE_INTENSITY"
          />
          <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
            <feFuncA type="discrete" tableValues={`0 ${aberrationIntensity * 0.05} 1`} />
          </feComponentTransfer>
          <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="DISPLACEMENT_MAP"
            scale={baseScale}
            xChannelSelector="R"
            yChannelSelector="B"
            result="RED_DISPLACED"
          />
          <feColorMatrix
            in="RED_DISPLACED"
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="RED_CHANNEL"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="DISPLACEMENT_MAP"
            scale={baseScale - aberrationIntensity * 0.05}
            xChannelSelector="R"
            yChannelSelector="B"
            result="GREEN_DISPLACED"
          />
          <feColorMatrix
            in="GREEN_DISPLACED"
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="GREEN_CHANNEL"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="DISPLACEMENT_MAP"
            scale={baseScale - aberrationIntensity * 0.1}
            xChannelSelector="R"
            yChannelSelector="B"
            result="BLUE_DISPLACED"
          />
          <feColorMatrix
            in="BLUE_DISPLACED"
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            result="BLUE_CHANNEL"
          />
          <feBlend in="GREEN_CHANNEL" in2="BLUE_CHANNEL" mode="screen" result="GB_COMBINED" />
          <feBlend in="RED_CHANNEL" in2="GB_COMBINED" mode="screen" result="RGB_COMBINED" />
          <feGaussianBlur
            in="RGB_COMBINED"
            stdDeviation={Math.max(0.1, 0.5 - aberrationIntensity * 0.1)}
            result="ABERRATED_BLURRED"
          />
          <feComposite in="ABERRATED_BLURRED" in2="EDGE_MASK" operator="in" result="EDGE_ABERRATION" />
          <feComponentTransfer in="EDGE_MASK" result="INVERTED_MASK">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feComposite in="CENTER_ORIGINAL" in2="INVERTED_MASK" operator="in" result="CENTER_CLEAN" />
          <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

export type LiquidGlassCardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  cornerRadius?: number;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  overLight?: boolean;
  mode?: LiquidGlassCardMode;
};

export const LiquidGlassCard = forwardRef<HTMLDivElement, LiquidGlassCardProps>(function LiquidGlassCard(
  {
    children,
    className = "",
    style,
    cornerRadius = 24,
    displacementScale = 42,
    blurAmount = 0.075,
    saturation = 180,
    aberrationIntensity = 1.75,
    overLight = true,
    mode = "prominent",
  },
  ref,
) {
  const filterId = useId();
  const glassInnerRef = useRef<HTMLDivElement>(null);
  const [glassSize, setGlassSize] = useState({ width: 300, height: 200 });

  const syncSize = useCallback(() => {
    const el = glassInnerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setGlassSize({
      width: Math.max(1, Math.round(r.width)),
      height: Math.max(1, Math.round(r.height)),
    });
  }, []);

  useLayoutEffect(() => {
    syncSize();
    const el = glassInnerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => syncSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncSize]);

  const isFirefox =
    typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("firefox");

  const backdropBlurPx = (overLight ? 12 : 4) + blurAmount * 32;
  const backdropStyle: CSSProperties = {
    filter: isFirefox ? undefined : `url(#${filterId})`,
    backdropFilter: `blur(${backdropBlurPx}px) saturate(${saturation}%)`,
    WebkitBackdropFilter: `blur(${backdropBlurPx}px) saturate(${saturation}%)`,
  };

  return (
    <div ref={ref} className={["relative min-w-0", className].filter(Boolean).join(" ")} style={style}>
      <GlassFilter
        id={filterId}
        displacementScale={displacementScale}
        aberrationIntensity={aberrationIntensity}
        width={glassSize.width}
        height={glassSize.height}
        mode={mode}
      />
      <div
        ref={glassInnerRef}
        className="relative w-full min-w-0 overflow-hidden"
        style={{
          borderRadius: `${cornerRadius}px`,
        }}
      >
        <span
          className="glass__warp pointer-events-none absolute inset-0 block"
          style={backdropStyle}
          aria-hidden
        />
        <div className="relative z-[1] min-w-0">{children}</div>
      </div>
    </div>
  );
});

LiquidGlassCard.displayName = "LiquidGlassCard";
