/** Injected in HTML `<head>` (`injectPublicRustOrigin` in `seo.ts`). */
declare global {
  interface Window {
    __CLAWPIFY_PUBLIC_API_BASE__?: string;
  }
}

export function publicRustOrigin(): string {
  if (typeof window !== "undefined") {
    const g = window.__CLAWPIFY_PUBLIC_API_BASE__;
    if (typeof g === "string" && g.length > 0) return g;
  }
  if (typeof process !== "undefined" && process.env?.RUST_API_URL)
    return process.env.RUST_API_URL;
  return "";
}
