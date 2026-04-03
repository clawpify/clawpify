/** Reads `{ error: string }` or `{ error: { message: string } }` from JSON bodies. */
export function messageFromErrorBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("error" in body)) return;
  const error = (body as { error: unknown }).error;
  if (typeof error === "string") return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
}
