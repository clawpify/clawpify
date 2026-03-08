import { useAuth } from "@clerk/react";

const API_BASE = "";

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
