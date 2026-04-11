import { useAuth } from "@clerk/react";
import { useCallback } from "react";
import { messageFromErrorBody } from "./messageFromErrorBody";


function apiUrl(path: string): string {
  const base = process.env.RUST_API_URL
  if (!base) return path;
  return new URL(path, base).href;
}

/** Clerk Bearer + one retry on 401 / org-required 400. */
export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  return useCallback(
    async (path: string, init?: RequestInit): Promise<Response> => {
      const request = async (forceRefresh = false) => {
        const token = await getToken(forceRefresh ? { skipCache: true } : undefined);
        
        const headers = new Headers(init?.headers);

        if (token) headers.set("Authorization", `Bearer ${token}`);

        return fetch(apiUrl(path), { ...init, headers });
      };

      const res = await request();
      if (res.status === 401) return request(true);
      if (res.status === 400) {
        const body = await res.clone().json().catch(() => undefined);

        const message = messageFromErrorBody(body);

        if (message?.toLowerCase().includes("org required")) return request(true);
      }

      return res;
    },
    [getToken],
  );
}
