import { Show, RedirectToSignIn } from "@clerk/react";
import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/react";

type OnboardingGateProps = {
  children: React.ReactNode;
};

/**
 * Onboarding gate component.
 *
 * @param children - The children to render.
 * @returns The onboarding gate component.
 */
export function OnboardingGate({ children }: OnboardingGateProps) {
  return (
    <>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
      <Show when="signed-in">
        <OnboardingGateContent>{children}</OnboardingGateContent>
      </Show>
    </>
  );
}

/**
 * Onboarding gate content component.
 *
 * @param children - The children to render.
 * @returns The onboarding gate content component.
 */
function OnboardingGateContent({ children }: OnboardingGateProps) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span className="text-zinc-500">Loading...</span>
      </div>
    );
  }

  const metadata = user?.publicMetadata as { onboardingComplete?: boolean };
  if (!metadata?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
