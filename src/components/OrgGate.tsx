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
