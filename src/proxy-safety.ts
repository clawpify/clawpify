/**
 * Boot-time logs and guards for Bun → Rust proxy. Mis-set RUST_API_URL on Railway
 * (same public URL as this Bun service) causes recursive fetches and runaway metrics.
 */

function trimTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

function originOf(u: URL): string {
  return `${u.protocol}//${u.host}`;
}

function bunPublicUrlFromEnv(): string | null {
  const a = process.env.BUN_SERVICE_URL?.trim();
  if (a) return a;
  const b = process.env.RAILWAY_STATIC_URL?.trim();
  if (b) return b;
  const d = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (!d) return null;
  if (/^https?:\/\//i.test(d)) return d;
  return `https://${d}`;
}

/**
 * Log resolved upstream (for correlating spikes with `/api/health` / `/api/subscribers` proxy paths)
 * and exit if the upstream origin clearly matches this Bun deployment's public URL.
 */
export function logAndValidateRustProxy(listenPort: number): void {
  const raw = process.env.RUST_API_URL?.trim();
  const effective = raw && raw.length > 0 ? raw : "http://127.0.0.1:3000";

  let rust: URL;
  try {
    rust = new URL(effective);
  } catch {
    console.error("[fatal] RUST_API_URL is not a valid URL:", effective);
    process.exit(1);
  }

  const rustHost = rust.hostname.toLowerCase();
  const rustOrigin = originOf(rust);
  const schemeHostPort = `${rust.protocol}//${rust.host}`;

  console.log(
    `[proxy] Rust upstream ${schemeHostPort} | Bun PORT=${listenPort} | proxied routes include GET /api/health, POST /api/subscribers`
  );

  const railwayInternal = rustHost.endsWith(".railway.internal");
  const isLocal = rustHost === "localhost" || rustHost === "127.0.0.1";

  if (process.env.NODE_ENV === "production" && isLocal) {
    console.warn(
      "[warn] RUST_API_URL uses localhost in production. Unless Rust runs in the same container, set it to your Rust service URL, e.g. http://<rust-service>.railway.internal:<PORT>."
    );
  }

  // Public Railway edge URLs for RUST_API_URL almost always mean either the Bun app URL
  // (infinite proxy loop) or avoidable latency. Require private networking unless opted in.
  if (
    process.env.NODE_ENV === "production" &&
    rustHost.endsWith(".railway.app") &&
    !railwayInternal
  ) {
    if (process.env.ALLOW_RAILWAY_PUBLIC_RUST_URL === "1") {
      console.warn(
        "[warn] ALLOW_RAILWAY_PUBLIC_RUST_URL=1: using public *.railway.app for RUST_API_URL — ensure this is the Rust service hostname, not the Bun app."
      );
    } else {
      console.error(
        "[fatal] RUST_API_URL must use Railway private networking in production, e.g. " +
          "http://<your-rust-service-name>.railway.internal:<PORT> (not *.up.railway.app on the Bun service). " +
          "Override only if Rust is genuinely public-only: ALLOW_RAILWAY_PUBLIC_RUST_URL=1"
      );
      process.exit(1);
    }
  }

  const bunPublic = bunPublicUrlFromEnv();
  if (bunPublic && process.env.ALLOW_RUST_PROXY_SAME_ORIGIN !== "1") {
    try {
      const normalized = trimTrailingSlash(bunPublic);
      const withScheme = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
      const bunOrigin = originOf(new URL(withScheme));
      if (bunOrigin === rustOrigin) {
        console.error(
          "[fatal] RUST_API_URL origin matches this Bun service public URL (BUN_SERVICE_URL / Railway URL vars). " +
            "That causes an infinite proxy loop. Set RUST_API_URL to the Rust service private URL only. " +
            "Unsafe override: ALLOW_RUST_PROXY_SAME_ORIGIN=1"
        );
        process.exit(1);
      }
    } catch {
      /* ignore invalid public URL in env */
    }
  }
}
