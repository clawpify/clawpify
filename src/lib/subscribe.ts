import type { SubscribeRequest, SubscribeResponse } from "../types/subscribe";
import { RUST_API_URL } from "./constants";
import { messageFromErrorBody } from "./messageFromErrorBody";

export type { SubscribeRequest, SubscribeResponse };

export async function subscribe(
  body: SubscribeRequest
): Promise<SubscribeResponse> {
  const base = RUST_API_URL;
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
