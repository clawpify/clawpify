import { verifyToken } from "@clerk/backend";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

export async function getAuthToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const url = new URL(req.url);
  const sessionToken = url.searchParams.get("__session");
  if (sessionToken) {
    return sessionToken;
  }
  const cookieHeader = req.headers.get("Cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/__session=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}

export async function requireAuth(req: Request): Promise<{
  userId: string;
  orgId?: string;
  orgRole?: string;
}> {
  if (!CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }

  const token = await getAuthToken(req);
  if (!token) {
    throw new AuthError("Missing or invalid authorization");
  }

  const payload = await verifyToken(token, {
    secretKey: CLERK_SECRET_KEY,
  });

  if (!payload) {
    throw new AuthError("Invalid or expired token");
  }

  const sub = payload.sub;
  if (!sub) {
    throw new AuthError("Token missing subject");
  }

  return {
    userId: sub,
    orgId: payload.org_id as string | undefined,
    orgRole: payload.org_role as string | undefined,
  };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
