import { messageFromErrorBody } from "./messageFromErrorBody";
import { publicRustOrigin } from "./publicRustOrigin";
import type { SubscribeRequest, SubscribeResponse } from "../types/subscribe";

export type { SubscribeRequest, SubscribeResponse };

export async function subscribe(
  body: SubscribeRequest
): Promise<SubscribeResponse> {
  const base = publicRustOrigin();
  const url = base ? new URL("/api/waitlist", base).href : "/api/waitlist";
  const res = await fetch(url, {
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
