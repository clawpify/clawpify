import type { CitationData, CitationForm } from "../types";

const API_BASE = "";

export type GenerateResponse = {
  prompts: string[];
  competitors: string[];
};

function authHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function generatePromptsAndCompetitors(
  websiteUrl: string,
  companyName: string,
  token?: string | null
): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/api/chatgpt-citation/generate`, {
    method: "POST",
    headers: authHeaders(token ?? null),
    body: JSON.stringify({ website_url: websiteUrl, company_name: companyName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<GenerateResponse>;
}

export async function createCitation(
  form: CitationForm,
  customPrompts?: string[],
  runSearch: boolean = true,
  token?: string | null
): Promise<{ id: string }> {
  const requestBody =
    customPrompts && customPrompts.length > 0
      ? { ...form, custom_prompts: customPrompts, run_search: runSearch }
      : { ...form, run_search: runSearch };
  const res = await fetch(`${API_BASE}/api/chatgpt-citation`, {
    method: "POST",
    headers: authHeaders(token ?? null),
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${res.status}`);
  }

  const data = (await res.json()) as { id: string };
  return data;
}

export type JoinWaitlistRequest = {
  email: string;
};

export type JoinWaitlistResponse = {
  id: string;
  already_on_list: boolean;
};

export async function joinWaitlist(
  body: JoinWaitlistRequest
): Promise<JoinWaitlistResponse> {
  const res = await fetch(`${API_BASE}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<JoinWaitlistResponse>;
}

export async function pollCitation(id: string): Promise<CitationData> {
  const r = await fetch(`${API_BASE}/api/chatgpt-citation/${id}`);
  if (!r.ok) throw new Error("Failed to fetch results");
  const data = (await r.json()) as CitationData;
  console.log("[pollCitation] citation data:", data);
  if (data.results) {
    data.results.forEach((result, i) => {
      console.log(`[pollCitation] result[${i}] citation_urls:`, result.citation_urls);
    });
  }
  return data;
}
