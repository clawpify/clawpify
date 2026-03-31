import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 1024px)";

function getMql(): MediaQueryList | null {
  if (typeof window === "undefined") return null;
  return window.matchMedia(QUERY);
}

export function useIsLgUp(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = getMql();
      if (!mql) return () => {};
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => getMql()?.matches ?? false,
    () => false
  );
}
