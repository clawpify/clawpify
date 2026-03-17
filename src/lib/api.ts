import { useAuth } from "@clerk/react";
import { useCallback } from "react";

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

  return useCallback(
    async (path: string, init?: RequestInit): Promise<Response> => {
      const request = async (forceRefresh = false) => {
        const token = await getToken(forceRefresh ? { skipCache: true } : undefined);
        const headers = new Headers(init?.headers);
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return fetch(`${API_BASE}${path}`, { ...init, headers });
      };

      const res = await request();
      // Retry once with a fresh token if the cached one was expired
      if (res.status === 401) return request(true);
      return res;
    },
    [getToken],
  );
}
