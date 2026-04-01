import { useEffect, useState } from "react";
import { useAuthenticatedFetch } from "./api";

/** Raw `<img src>` to `/api/s3/objects` does not send Bearer; fetch via `useAuthenticatedFetch` instead. */
export function imageUrlNeedsAuthFetch(raw: string): boolean {
  const t = raw.trim();
  if (!t || t.startsWith("data:") || t.startsWith("blob:")) return false;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(t, base);
    if (!u.pathname.startsWith("/api/s3")) return false;
    if (typeof window !== "undefined" && u.origin !== window.location.origin) return false;
    return true;
  } catch {
    return false;
  }
}

export function pathForAuthenticatedImageFetch(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("/")) return t;
  const u = new URL(t);
  return `${u.pathname}${u.search}`;
}

/**
 * Returns a display URL: same string for public/data URLs, or a blob object URL for `/api/s3` (revoked on change/unmount).
 */
export function useAuthenticatedImageUrl(
  src: string | null | undefined,
  fetchAuth: (path: string, init?: RequestInit) => Promise<Response>
): string | null {
  const trimmed = src?.trim() ?? "";
  const needsAuth = trimmed.length > 0 && imageUrlNeedsAuthFetch(trimmed);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!needsAuth) {
      setBlobUrl(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const path = pathForAuthenticatedImageFetch(trimmed);
        const res = await fetchAuth(path);
        if (cancelled || !res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) setBlobUrl(null);
      }
    })();

    return () => {
      cancelled = true;
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [needsAuth, trimmed, fetchAuth]);

  if (!trimmed) return null;
  if (!needsAuth) return trimmed;
  return blobUrl;
}

type AuthenticatedImgProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

export function AuthenticatedImg({ src, alt, className, loading }: AuthenticatedImgProps) {
  const fetchAuth = useAuthenticatedFetch();
  const url = useAuthenticatedImageUrl(src, fetchAuth);

  if (!url) return null;

  return <img src={url} alt={alt} className={className} loading={loading} />;
}
