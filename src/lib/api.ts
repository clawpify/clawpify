import { useAuth } from "@clerk/react";

const API_BASE = "";

export type LogActivityPayload = {
  agent_name: string;
  action_type: string;
  store_id?: string;
  payload?: Record<string, unknown>;
};

export async function logAgentActivity(
  fetchAuth: (path: string, init?: RequestInit) => Promise<Response>,
  body: LogActivityPayload
): Promise<void> {
  try {
    const res = await fetchAuth("/api/agent-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
  } catch {
    // Silent fail - user may not have org context
  }
}

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  return async (path: string, init?: RequestInit): Promise<Response> => {
    const token = await getToken();
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });
  };
}
