export type EbayStatus = "loading" | "connected" | "disconnected";

export type EbaySetupHint = {
  message: string;
  showBusinessPoliciesLink: boolean;
  showInventoryLocationsLink: boolean;
};
