import { useAuth } from "@clerk/react";
import { useCallback } from "react";
import type { LogActivityPayload } from "../types/agent-activity";
import { messageFromErrorBody } from "./messageFromErrorBody";

const API_BASE = "";

export type { LogActivityPayload };

/**
 * Fire-and-forget log of agent activity to the backend.
 * Silently swallows errors — caller should never block on this.
 *
 * @param fetchAuth - Authenticated fetch function (from `useAuthenticatedFetch`).
 * @param body - Activity payload to record.
 */
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
    // Silent fail — user may not have org context
  }
}

/**
 * React hook that returns an authenticated fetch function.
 * Automatically attaches a Bearer token and retries once with a fresh token on 401.
 *
 * @returns An async function with the same signature as `fetch` (path + optional RequestInit).
 */
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
      if (res.status === 400) {
        const body = await res.clone().json().catch(() => undefined);
        const message = messageFromErrorBody(body);
        if (message?.toLowerCase().includes("org required")) {
          return request(true);
        }
      }

      return res;
    },
    [getToken],
  );
}
