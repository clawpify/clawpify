import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuthenticatedFetch } from "./api";

/** Shared blob URLs per S3 path so hero + thumbs + Strict Mode remounts do not re-fetch / flash pulse. */
type AuthImageCell = {
  refCount: number;
  blobUrl: string | null;
  inflight: Promise<string> | null;
};

const authImageCells = new Map<string, AuthImageCell>();

function touchAuthImageCell(path: string): AuthImageCell {
  let c = authImageCells.get(path);
  if (!c) {
    c = { refCount: 0, blobUrl: null, inflight: null };
    authImageCells.set(path, c);
  }
  return c;
}

/** Bumps ref count; returns immediate blob URL if already cached, plus a promise that settles when URL is known. */
function retainAuthImageBlob(
  path: string,
  fetchAuth: (path: string, init?: RequestInit) => Promise<Response>
): { syncUrl: string | null; ready: Promise<string> } {
  const c = touchAuthImageCell(path);
  c.refCount += 1;
  if (c.blobUrl) {
    return { syncUrl: c.blobUrl, ready: Promise.resolve(c.blobUrl) };
  }
  if (!c.inflight) {
    c.inflight = (async () => {
      try {
        const res = await fetchAuth(path);
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const cur = authImageCells.get(path);
        if (cur) cur.blobUrl = url;
        return url;
      } finally {
        const cur = authImageCells.get(path);
        if (cur) cur.inflight = null;
      }
    })();
  }
  return { syncUrl: null, ready: c.inflight };
}

function reallyReleaseAuthImageBlob(path: string) {
  const c = authImageCells.get(path);
  if (!c || c.refCount > 0) return;
  if (c.blobUrl) {
    URL.revokeObjectURL(c.blobUrl);
    authImageCells.delete(path);
    return;
  }
  const inflight = c.inflight;
  if (inflight) {
    void inflight
      .then((url) => {
        const cur = authImageCells.get(path);
        if (cur && cur.refCount <= 0) {
          URL.revokeObjectURL(url);
          authImageCells.delete(path);
        }
      })
      .catch(() => {
        authImageCells.delete(path);
      });
  } else {
    authImageCells.delete(path);
  }
}

function releaseAuthImageBlob(path: string) {
  const c = authImageCells.get(path);
  if (!c || c.refCount <= 0) return;
  c.refCount -= 1;
  if (c.refCount > 0) return;
  // Defer past the current React commit so Strict Mode unmount→remount can re-retain before revoke.
  setTimeout(() => reallyReleaseAuthImageBlob(path), 0);
}

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

export type AuthenticatedImageUrlState = {
  /** Resolved URL for `<img src>`, or `null` while loading / when auth fetch failed. */
  displayUrl: string | null;
  authFetchFailed: boolean;
};

/**
 * Same-origin `/api/s3` URLs need a Bearer fetch; returns a blob URL or the original string for public URLs.
 */
export function useAuthenticatedImageUrl(
  src: string | null | undefined,
  fetchAuth: (path: string, init?: RequestInit) => Promise<Response>
): AuthenticatedImageUrlState {
  const trimmed = src?.trim() ?? "";
  const needsAuth = trimmed.length > 0 && imageUrlNeedsAuthFetch(trimmed);
  const fetchAuthRef = useRef(fetchAuth);
  fetchAuthRef.current = fetchAuth;

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [authFetchFailed, setAuthFetchFailed] = useState(false);

  useLayoutEffect(() => {
    if (!needsAuth) {
      setBlobUrl(null);
      setAuthFetchFailed(false);
      return;
    }

    setAuthFetchFailed(false);
    let cancelled = false;
    const path = pathForAuthenticatedImageFetch(trimmed);

    const { syncUrl, ready } = retainAuthImageBlob(path, fetchAuthRef.current);
    if (syncUrl) setBlobUrl(syncUrl);
    else setBlobUrl(null);

    void ready
      .then((url) => {
        if (cancelled) return;
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setAuthFetchFailed(true);
      });

    return () => {
      cancelled = true;
      releaseAuthImageBlob(path);
    };
  }, [needsAuth, trimmed]);

  if (!trimmed) return { displayUrl: null, authFetchFailed: false };
  if (!needsAuth) return { displayUrl: trimmed, authFetchFailed: false };
  return { displayUrl: blobUrl, authFetchFailed };
}

/**
 * Retains shared blob fetches for `/api/s3` URLs as soon as URLs are known so
 * `AuthenticatedImg` mounts often hit a warm cache (less pulse after listing load).
 */
export function usePrefetchAuthImageUrls(urls: readonly string[]) {
  const fetchAuth = useAuthenticatedFetch();
  const fetchAuthRef = useRef(fetchAuth);
  fetchAuthRef.current = fetchAuth;
  const urlsRef = useRef(urls);
  urlsRef.current = urls;
  const urlKey = useMemo(() => urls.join("\x1e"), [urls]);

  useLayoutEffect(() => {
    const list = urlsRef.current;
    const paths = [
      ...new Set(
        list.filter((u) => imageUrlNeedsAuthFetch(u)).map((u) => pathForAuthenticatedImageFetch(u))
      ),
    ];
    for (const p of paths) {
      retainAuthImageBlob(p, fetchAuthRef.current);
    }
    return () => {
      for (const p of paths) {
        releaseAuthImageBlob(p);
      }
    };
  }, [urlKey]);
}

type AuthenticatedImgProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

function placeholderClass(className: string | undefined, extra: string) {
  return [className, extra].filter(Boolean).join(" ");
}

export function AuthenticatedImg({ src, alt, className, loading }: AuthenticatedImgProps) {
  const fetchAuth = useAuthenticatedFetch();
  const trimmed = src?.trim() ?? "";
  const needsAuth = trimmed.length > 0 && imageUrlNeedsAuthFetch(trimmed);
  const { displayUrl, authFetchFailed } = useAuthenticatedImageUrl(src, fetchAuth);

  if (!trimmed) return null;

  if (needsAuth && authFetchFailed) {
    return (
      <div
        className={placeholderClass(className, "bg-zinc-200/90")}
        role="img"
        aria-label={alt}
      />
    );
  }

  if (needsAuth && !displayUrl) {
    return (
      <div className={placeholderClass(className, "animate-pulse bg-zinc-200/80")} aria-hidden />
    );
  }

  if (!displayUrl) return null;

  return <img src={displayUrl} alt={alt} className={className} loading={loading} />;
}
