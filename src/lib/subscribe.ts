import { messageFromErrorBody } from "./messageFromErrorBody";
import type { SubscribeRequest, SubscribeResponse } from "../types/subscribe";

export type { SubscribeRequest, SubscribeResponse };

/**
 * Empty base = same-origin `/api/*` (Bun proxies via `RUST_API_URL`).
 * Set `BUN_PUBLIC_API_BASE` when the browser should call the API host directly.
 */
function apiBase(): string {
  if (typeof process === "undefined") return "";
  const raw = process.env.BUN_PUBLIC_API_BASE;
  return raw ? String(raw).replace(/\/$/, "") : "";
}

export async function subscribe(
  body: SubscribeRequest
): Promise<SubscribeResponse> {
  const res = await fetch(`${apiBase()}/api/subscribers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => undefined);
    throw new Error(
      messageFromErrorBody(payload) ?? `Request failed: ${res.status}`
    );
  }

  return res.json() as Promise<SubscribeResponse>;
}
