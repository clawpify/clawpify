import { useState, useEffect, type RefObject } from "react";

const SCROLL_THRESHOLD_PX = 1600;


export function getScrollSegment(progress: number, start: number, end: number) {
  if (end <= start) return progress >= end ? 1 : 0;
  return Math.min(Math.max((progress - start) / (end - start), 0), 1);
}

export function useScrollProgress(scrollRef: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const p = Math.min(el.scrollTop / SCROLL_THRESHOLD_PX, 1);
      setProgress(p);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  return progress;
}
