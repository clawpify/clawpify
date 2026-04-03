import { messageFromErrorBody } from "./messageFromErrorBody";
import type { SubscribeRequest, SubscribeResponse } from "../types/subscribe";

export type { SubscribeRequest, SubscribeResponse };

export async function subscribe(
  body: SubscribeRequest
): Promise<SubscribeResponse> {
  const base = process.env.RUST_API_URL ?? "";
  const url = new URL(`${base}/api/waitlist`);
  const res = await fetch(url.toString(), {
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
