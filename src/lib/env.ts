// Bun loads `.env` at startup.

export const BUN_PUBLIC_API_URL = process.env.BUN_PUBLIC_API_URL ?? "";
export const BUN_PUBLIC_API_BASE = BUN_PUBLIC_API_URL;

export const BUN_PUBLIC_BASE_URL =
  process.env.BUN_PUBLIC_BASE_URL || "https://clawpify.com";

export const BUN_PUBLIC_CLERK_PUBLISHABLE_KEY =
  process.env.BUN_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  process.env.VITE_CLERK_PUBLISHABLE_KEY ??
  "";

export const isProduction = process.env.CLAWPIFY_PROD === "1";
export const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

export const RUST_API_URL = process.env.RUST_API_URL ?? "";
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

const proxyMsRaw = process.env.RUST_PROXY_TIMEOUT_MS;
const proxyMsParsed =
  proxyMsRaw != null && proxyMsRaw !== "" ? parseInt(proxyMsRaw, 10) : 25_000;
export const RUST_PROXY_TIMEOUT_MS =
  Number.isFinite(proxyMsParsed) && proxyMsParsed > 0 ? proxyMsParsed : 25_000;
