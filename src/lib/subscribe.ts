import { messageFromErrorBody } from "./messageFromErrorBody";
import type { SubscribeRequest, SubscribeResponse } from "../types/subscribe";

export type { SubscribeRequest, SubscribeResponse };

export async function subscribe(
  body: SubscribeRequest
): Promise<SubscribeResponse> {
  const base = (typeof process !== "undefined" ? process.env.RUST_API_URL ?? "" : "")
    .trim()
    .replace(/\/$/, "");
  const res = await fetch(`${base}/api/subscribers`, {
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
