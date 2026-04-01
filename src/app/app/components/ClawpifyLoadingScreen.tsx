import { useEffect, useRef, useState } from "react";
import clawpifyMark from "../../../clawpify-mark.svg";
import { copy } from "../utils/copy";

type ClawpifyLoadingScreenProps = {
  variant?: "fullscreen" | "fill";
  message?: string;
  className?: string;
};

export function ClawpifyLoadingScreen({
  variant = "fullscreen",
  message = copy.settingUpWorkspace,
  className = "",
}: ClawpifyLoadingScreenProps) {
  const markImgRef = useRef<HTMLImageElement>(null);
  const [markReady, setMarkReady] = useState(false);

  useEffect(() => {
    const el = markImgRef.current;
    if (el?.complete && el.naturalWidth > 0) setMarkReady(true);
  }, []);

  const outer =
    variant === "fullscreen"
      ? `flex min-h-screen items-center justify-center bg-white px-6 ${className}`.trim()
      : `flex min-h-0 flex-1 w-full items-center justify-center bg-inherit ${className}`.trim();

  return (
    <div role="status" aria-live={markReady ? "polite" : "off"} aria-busy={!markReady} className={outer}>
      <div className="flex flex-col items-center gap-3">
        <img
          ref={markImgRef}
          src={clawpifyMark}
          alt=""
          className="h-12 w-12 rounded-full object-contain"
          width={48}
          height={48}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          onLoad={() => setMarkReady(true)}
          onError={() => setMarkReady(true)}
        />
        <p
          className={`min-h-[1.25rem] text-center text-sm text-zinc-400 transition-opacity duration-200 ${
            markReady ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={!markReady}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
