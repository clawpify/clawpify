import { requireAuth, AuthError } from "../lib/auth";
import { proxyToRust } from "../utils/networkFns";

const isEmail = (contact: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);

const isPhoneLike = (contact: string) => /^\+?[0-9()\-\s]{7,}$/.test(contact);
const isStrictE164 = (contact: string) => /^\+[1-9]\d{6,14}$/.test(contact);

function splitName(displayName: string): { firstName: string; lastName?: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? displayName.trim() };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

export async function handleProvisionConsignor(req: Request) {
  try {
    const auth = await requireAuth(req);
    const { clerkClient } = await import("../lib/clerk.ts");
    if (!clerkClient) {
      return Response.json({ error: "Clerk not configured" }, { status: 500 });
    }

    const body = (await req.json()) as {
      displayName?: string;
      contact?: string;
      organizationId?: string;
    };

    const displayName = body.displayName?.trim() ?? "";
    const contact = body.contact?.trim() ?? "";
    if (!displayName) {
      return Response.json({ error: "displayName required" }, { status: 400 });
    }
    if (!contact) {
      return Response.json({ error: "contact required" }, { status: 400 });
    }

    const tokenOrgId = auth.orgId;
    const bodyOrgId = body.organizationId;
    const orgId =
      tokenOrgId ??
      (process.env.NODE_ENV !== "production" ? bodyOrgId : undefined);

    if (!orgId || !orgId.startsWith("org_")) {
      return Response.json({ error: "Active organization required" }, { status: 400 });
    }

    const email = isEmail(contact) ? contact.toLowerCase() : undefined;
    const phone = !email && isPhoneLike(contact) ? contact : undefined;
    if (!email && !phone) {
      return Response.json(
        { error: "contact must be a valid email or phone number" },
        { status: 400 }
      );
    }
    if (phone && !isStrictE164(phone)) {
      return Response.json(
        { error: "Phone contact must be E.164 format (e.g. +15551234567)" },
        { status: 400 }
      );
    }

    const { firstName, lastName } = splitName(displayName);
    const user = await clerkClient.users.createUser({
      firstName,
      ...(lastName ? { lastName } : {}),
      ...(email ? { emailAddress: [email] } : {}),
      ...(phone ? { phoneNumber: [phone] } : {}),
      skipPasswordChecks: true,
      skipPasswordRequirement: true,
    });

    await clerkClient.organizations.createOrganizationMembership({
      organizationId: orgId,
      userId: user.id,
      role: "org:member",
    });

    const authWithOrg = { ...auth, orgId };

    const consignorReq = new Request(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName,
        ...(email ? { email } : {}),
        ...(phone ? { phone_e164: phone } : {}),
      }),
    });

    return proxyToRust(consignorReq, "/api/consignors", authWithOrg);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    const { message: clerkMessage, status } = clerkApiErrorDetails(error);
    if (clerkMessage) {
      console.error("POST /api/consignors/provision Clerk error:", clerkMessage);
      return Response.json({ error: clerkMessage }, { status: status ?? 422 });
    }
    console.error("POST /api/consignors/provision failed:", error);
    return Response.json({ error: "Failed to create consignor" }, { status: 500 });
  }
}

function clerkApiErrorDetails(error: unknown): { message?: string; status?: number } {
  if (!error || typeof error !== "object") return {};
  const rec = error as Record<string, unknown>;
  const status = typeof rec.status === "number" ? rec.status : undefined;
  const first = Array.isArray(rec.errors) ? rec.errors[0] : undefined;
  if (first && typeof first === "object") {
    const err = first as Record<string, unknown>;
    const longMessage = err.longMessage;
    const nested = err.message;
    if (typeof longMessage === "string" && longMessage.length > 0) return { message: longMessage, status };
    if (typeof nested === "string" && nested.length > 0) return { message: nested, status };
  }
  const top = rec.message;
  if (typeof top === "string" && top.length > 0) return { message: top, status };
  return { status };
}
