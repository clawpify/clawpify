import type { ConsignorDto } from "../types";

export const CONSIGNORS_API_LIST = "/api/consignors";
export const CONSIGNORS_API_PROVISION = "/api/consignors/provision";

export type CreateConsignorProvisionInput = {
  displayName: string;
  contact: string;
  organizationId?: string;
};

type ApiErrorEnvelope = {
  error?: {
    message?: string;
  };
};

async function parseApiError(res: Response): Promise<string> {
  let detail = res.statusText || `HTTP ${res.status}`;
  try {
    const body = (await res.json()) as ApiErrorEnvelope;
    if (body?.error?.message) detail = body.error.message;
  } catch {
    // ignored
  }
  return detail;
}

export async function listConsignors(
  fetchAuth: (path: string, init?: RequestInit) => Promise<Response>,
  organizationId?: string
): Promise<ConsignorDto[]> {
  const headers = new Headers();
  if (organizationId) headers.set("X-Selected-Org-Id", organizationId);
  const res = await fetchAuth(CONSIGNORS_API_LIST, {
    headers,
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return (await res.json()) as ConsignorDto[];
}

export async function createConsignorWithClerkUser(
  fetchAuth: (path: string, init?: RequestInit) => Promise<Response>,
  input: CreateConsignorProvisionInput
): Promise<ConsignorDto> {
  const res = await fetchAuth(CONSIGNORS_API_PROVISION, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return (await res.json()) as ConsignorDto;
}
