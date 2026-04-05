import { useLocation } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";
import { AuthPageLayout } from "./AuthPageLayout";

/** Only allow same-origin `/app` paths as post-login redirects (no open redirects). */
function safeAppReturnPath(from: unknown): string | undefined {
  if (typeof from !== "string" || !from.startsWith("/")) return undefined;
  if (from.startsWith("//")) return undefined;
  if (!from.startsWith("/app")) return undefined;
  return from;
}

export function SignInRoute() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const fallbackRedirectUrl = safeAppReturnPath(from) ?? "/app";
  return (
    <AuthPageLayout>
      <SignIn fallbackRedirectUrl={fallbackRedirectUrl} signUpUrl="/sign-up" />
    </AuthPageLayout>
  );
}

export function SignUpRoute() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const fallbackRedirectUrl = safeAppReturnPath(from) ?? "/app";
  return (
    <AuthPageLayout>
      <SignUp fallbackRedirectUrl={fallbackRedirectUrl} signInUrl="/sign-in" />
    </AuthPageLayout>
  );
}
