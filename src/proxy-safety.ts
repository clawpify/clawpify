/**
 * Boot-time logs and guards for Bun → Rust proxy. Mis-set RUST_API_URL on Railway
 * (same host as this Bun service) causes recursive fetches and runaway metrics.
 */

import { rustApiBaseUrl } from "./utils/networkFns";

function trimTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

function addHostname(hosts: Set<string>, raw: string | undefined): void {
  if (!raw?.trim()) return;
  const t = trimTrailingSlash(raw.trim());
  try {
    const u = /^https?:\/\//i.test(t) ? new URL(t) : new URL(`https://${t}`);
    hosts.add(u.hostname.toLowerCase());
  } catch {
    const h = t.replace(/^https?:\/\//i, "").split("/")[0]?.split(":")[0];
    if (h) hosts.add(h.toLowerCase());
  }
}

/** Public hostname(s) for *this* Bun deployment — used only to detect self-proxy. */
function bunServicePublicHosts(): Set<string> {
  const hosts = new Set<string>();
  addHostname(hosts, process.env.BUN_SERVICE_URL);
  addHostname(hosts, process.env.RAILWAY_STATIC_URL);
  addHostname(hosts, process.env.RAILWAY_PUBLIC_DOMAIN);
  addHostname(hosts, process.env.BUN_PUBLIC_BASE_URL);
  return hosts;
}

/**
 * Log resolved upstream (for correlating spikes with `/api/health` / `/api/waitlist` proxy paths)
 * and exit if RUST_API_URL targets the same host as this Bun service (loop).
 */
export function logAndValidateRustProxy(listenPort: number): void {
  const usingInternal = Boolean(process.env.RUST_API_URL_INTERNAL?.trim());
  const effective = rustApiBaseUrl();

  let rust: URL;
  try {
    rust = new URL(effective);
  } catch {
    console.error("[fatal] Rust upstream base URL is not valid:", effective);
    process.exit(1);
  }

  const rustHost = rust.hostname.toLowerCase();
  const schemeHostPort = `${rust.protocol}//${rust.host}`;

  console.log(
    `[proxy] Rust upstream ${schemeHostPort}` +
      (usingInternal ? " (RUST_API_URL_INTERNAL)" : " (RUST_API_URL)") +
      ` | Bun PORT=${listenPort} | proxied routes include GET /api/health, POST /api/waitlist`
  );

  if (
    process.env.NODE_ENV === "production" &&
    !usingInternal &&
    rustHost.endsWith(".up.railway.app")
  ) {
    console.warn(
      "[warn] RUST_API_URL is a public *.up.railway.app host. If that hostname is *this* Bun app, proxies will fail. " +
        "Set RUST_API_URL_INTERNAL=http://<your-rust-service>.railway.internal:<PORT> on the Bun service."
    );
  }

  const railwayInternal = rustHost.endsWith(".railway.internal");
  const isLocal = rustHost === "localhost" || rustHost === "127.0.0.1";

  if (process.env.NODE_ENV === "production" && isLocal) {
    console.warn(
      "[warn] RUST_API_URL uses localhost in production. Unless Rust runs in the same container, set it to your Rust service URL, e.g. http://<rust-service>.railway.internal:<PORT>."
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    rustHost.includes("railway.app") &&
    !railwayInternal
  ) {
    console.warn(
      "[warn] RUST_API_URL uses a public *.railway.app host. If this is the same hostname as *this* Bun service, you will get proxy loops — prefer http://<rust-service>.railway.internal:<PORT>."
    );
  }

  const bunHosts = bunServicePublicHosts();
  if (
    process.env.NODE_ENV === "production" &&
    bunHosts.size > 0 &&
    bunHosts.has(rustHost) &&
    process.env.ALLOW_RUST_PROXY_SAME_HOST !== "1"
  ) {
    console.error(
      "[fatal] RUST_API_URL hostname matches this Bun service’s public host (see RAILWAY_PUBLIC_DOMAIN / BUN_SERVICE_URL / RAILWAY_STATIC_URL). " +
        "That causes an infinite proxy loop. Point RUST_API_URL at the Rust service host only (e.g. private *.railway.internal). " +
        "Unsafe override: ALLOW_RUST_PROXY_SAME_HOST=1"
    );
    process.exit(1);
  }
}
