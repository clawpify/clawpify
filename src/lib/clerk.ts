import { createClerkClient } from "@clerk/backend";

/**
 * Create a Clerk client using the secret key from the environment.
 *
 * @returns The Clerk client, or null if the secret key is not configured.
 */
const secretKey = process.env.CLERK_SECRET_KEY;

export const clerkClient = secretKey
  ? createClerkClient({ secretKey })
  : null;
