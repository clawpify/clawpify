const API_BASE = "";

export type SubscribeRequest = {
  email: string;
};

export type SubscribeResponse = {
  ok: boolean;
  already_subscribed?: boolean;
};

export async function subscribe(
  body: SubscribeRequest
): Promise<SubscribeResponse> {
  const res = await fetch(`${API_BASE}/api/subscribers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<SubscribeResponse>;
}
