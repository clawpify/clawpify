import { OrganizationProfile } from "@clerk/react";
import { clerkAppearance } from "../../lib/clerk-appearance.ts";

export function SettingsPage() {
  return (
    <div className="flex justify-center py-8">
      <OrganizationProfile
        afterLeaveOrganizationUrl="/"
        appearance={clerkAppearance}
      />
    </div>
  );
}
