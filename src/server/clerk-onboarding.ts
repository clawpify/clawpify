import { requireAuth, AuthError } from "../lib/auth";

export async function handleCompleteOnboarding(req: Request) {
  try {
    const auth = await requireAuth(req);
    const { clerkClient } = await import("../lib/clerk.ts");
    if (!clerkClient) {
      return Response.json({ error: "Clerk not configured" }, { status: 500 });
    }

    const body = (await req.json()) as {
      firstName?: string;
      lastName?: string;
    };

    if (body.firstName != null || body.lastName != null) {
      await clerkClient.users.updateUser(auth.userId, {
        ...(body.firstName != null && { firstName: body.firstName }),
        ...(body.lastName != null && { lastName: body.lastName }),
      });
    }

    await clerkClient.users.updateUserMetadata(auth.userId, {
      publicMetadata: { onboardingComplete: true },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}
