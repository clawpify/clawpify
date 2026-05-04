import { messageFromErrorBody } from "./messageFromErrorBody";

// Parse API responses and surface backend error messages when available.
export async function readJsonOrError<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new Error(messageFromErrorBody(body) ?? `Request failed: ${res.status}`);
  }
  return body as T;
}
