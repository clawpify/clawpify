import {
  useOrganization,
  Show,
  RedirectToSignIn,
  CreateOrganization,
} from "@clerk/react";
import { clerkAppearance } from "../lib/clerk-appearance.ts";

type OrgGateProps = {
  children: React.ReactNode;
};

/**
 * Org gate component.
 *
 * @param children - The children to render.
 * @returns The org gate component.
 */
export function OrgGate({ children }: OrgGateProps) {
  return (
    <>
      <Show when="signed-in">
        <OrgGateContent>{children}</OrgGateContent>
      </Show>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </>
  );
}


/**
 * Org gate content component.
 *
 * @param children - The children to render.
 * @returns The org gate content component.
 */
function OrgGateContent({ children }: OrgGateProps) {
  const { organization, isLoaded } = useOrganization();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          Create or select an organization to continue.
        </p>
        <CreateOrganization
          afterCreateOrganizationUrl="/app"
          skipInvitationScreen
          appearance={clerkAppearance}
        />
      </div>
    );
  }

  return <>{children}</>;
}
