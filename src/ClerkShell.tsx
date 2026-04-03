import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import { clerkAppearance } from "./lib/clerk-appearance.ts";
import { pathRequiresClerk } from "./lib/path-requires-clerk.ts";

const pk = process.env.BUN_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

type ClerkShellProps = {
  children: ReactNode;
};

export function ClerkShell({ children }: ClerkShellProps) {
  const { pathname } = useLocation();

  if (!pk || !pathRequiresClerk(pathname)) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={pk}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      appearance={clerkAppearance}
    >
      {children}
    </ClerkProvider>
  );
}
