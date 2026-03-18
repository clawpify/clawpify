import { verifyToken } from "@clerk/backend";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

/**
 * Extract the Clerk session token from a request.
 * Checks the Authorization header, then the `__session` query param, then the Cookie header.
 *
 * @param req - The incoming request to inspect.
 * @returns The raw session token string, or null if none was found.
 */
export async function getAuthToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  const url = new URL(req.url);
  const sessionToken = url.searchParams.get("__session");

  if (sessionToken) return sessionToken;

  const cookieHeader = req.headers.get("Cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/__session=([^;]+)/);

    if (match) return decodeURIComponent(match[1]!);
  }

  return null;
}

/**
 * Attempt to authenticate the request without throwing.
 * Returns auth context if the token is valid, or null for any failure.
 *
 * @param req - The incoming request to authenticate.
 * @returns Auth payload with userId and optional org fields, or null if unauthenticated.
 */
export async function getAuthOptional(req: Request): Promise<{
  userId: string;
  orgId?: string;
  orgRole?: string;
} | null> {
  if (!CLERK_SECRET_KEY) return null;

  const token = await getAuthToken(req);

  if (!token) return null;

  const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });

  if (!payload?.sub) return null;

  return {
    userId: payload.sub,
    orgId: payload.org_id as string | undefined,
    orgRole: payload.org_role as string | undefined,
  };
}

/**
 * Authenticate the request and return the auth context, throwing on any failure.
 *
 * @param req - The incoming request to authenticate.
 * @returns Auth payload with userId and optional org fields.
 * @throws {Error} If `CLERK_SECRET_KEY` is not configured.
 * @throws {AuthError} If the token is missing, invalid, or expired.
 */
export async function requireAuth(req: Request): Promise<{
  userId: string;
  orgId?: string;
  orgRole?: string;
}> {

  if (!CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is not configured");

  const token = await getAuthToken(req);

  if (!token) throw new AuthError("Missing or invalid authorization");

  const payload = await verifyToken(token, {
    secretKey: CLERK_SECRET_KEY,
  });

  if (!payload) throw new AuthError("Invalid or expired token");

  const sub = payload.sub;
  
  if (!sub) throw new AuthError("Token missing subject");

  return {
    userId: sub,
    orgId: payload.org_id as string | undefined,
    orgRole: payload.org_role as string | undefined,
  };
}

/** Error thrown by `requireAuth` when authentication fails. */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
