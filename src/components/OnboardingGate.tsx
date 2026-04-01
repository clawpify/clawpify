import { Show, RedirectToSignIn } from "@clerk/react";
import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/react";
import { ClawpifyLoadingScreen } from "../app/app/components/ClawpifyLoadingScreen";

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
      <div className="flex min-h-[200px] min-w-0 w-full flex-col bg-white">
        <ClawpifyLoadingScreen variant="fill" />
      </div>
    );
  }

  const metadata = user?.publicMetadata as { onboardingComplete?: boolean };
  if (!metadata?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
