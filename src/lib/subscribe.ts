import { messageFromErrorBody } from "./messageFromErrorBody";
import type { SubscribeRequest, SubscribeResponse } from "../types/subscribe";

export type { SubscribeRequest, SubscribeResponse };

const SUBSCRIBE_ORIGIN = "https://clawpify-production.up.railway.app";

export async function subscribe(
  body: SubscribeRequest
): Promise<SubscribeResponse> {
  const res = await fetch(`${SUBSCRIBE_ORIGIN}/api/subscribers`, {
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
