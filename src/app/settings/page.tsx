import { OrganizationProfile } from "@clerk/react";

export function SettingsPage() {
  return (
    <div className="flex justify-center py-8">
      <OrganizationProfile afterLeaveOrganizationUrl="/" />
    </div>
  );
}
