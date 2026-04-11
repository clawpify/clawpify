/**
 * Environment variables (Bun loads `.env` at process start).
 * Prefer importing from here instead of reading `process.env` directly.
 */

export const NODE_ENV = process.env.NODE_ENV ?? "development";

export const isProduction = NODE_ENV === "production";

export const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

export const RUST_API_URL = process.env.RUST_API_URL ?? "";

export const BUN_PUBLIC_RUST_API_URL = process.env.BUN_PUBLIC_RUST_API_URL ?? "";

export const BUN_PUBLIC_API_BASE = process.env.BUN_PUBLIC_API_BASE ?? "";

export const BUN_PUBLIC_BASE_URL =
  process.env.BUN_PUBLIC_BASE_URL || "https://clawpify.com";

export const BUN_PUBLIC_CLERK_PUBLISHABLE_KEY =
  process.env.BUN_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

/** Server-only; unset when not configured. */
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

const rawRustProxyTimeout = process.env.RUST_PROXY_TIMEOUT_MS;
const parsedRustProxyTimeout =
  rawRustProxyTimeout != null && rawRustProxyTimeout !== ""
    ? parseInt(rawRustProxyTimeout, 10)
    : 25_000;

export const RUST_PROXY_TIMEOUT_MS =
  Number.isFinite(parsedRustProxyTimeout) && parsedRustProxyTimeout > 0
    ? parsedRustProxyTimeout
    : 25_000;

export const CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS ?? "";

export const BUN_SERVICE_URL = process.env.BUN_SERVICE_URL ?? "";

/** Browser-visible API origin (HTML injection); prefers `BUN_PUBLIC_RUST_API_URL`. */
export const PUBLIC_RUST_API_ORIGIN = BUN_PUBLIC_RUST_API_URL || RUST_API_URL;
