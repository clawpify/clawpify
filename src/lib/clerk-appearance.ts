export const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorBackground: "#ffffff",
    colorInput: "#fafafa",
    colorInputForeground: "#18181b",
    colorPrimary: "#2563eb",
    colorPrimaryForeground: "#ffffff",
    colorForeground: "#18181b",
    colorMutedForeground: "#71717a",
    colorBorder: "#e4e4e7",
    colorMuted: "#f4f4f5",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    borderRadius: "0.375rem",
  },
  elements: {
    rootBox: "w-full",
    card: "shadow-sm rounded-lg border border-zinc-200 bg-white",
    formButtonPrimary:
      "rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium",
    formFieldInput: "rounded-md border-zinc-200",
    footerActionLink: "text-zinc-900 hover:text-zinc-600",
    identityPreviewEditButton: "text-zinc-900",
  },
  options: {
    logoImageUrl: "/clawpify-mark.svg",
    logoLinkUrl: "/",
    socialButtonsVariant: "blockButton" as const,
    socialButtonsPlacement: "top" as const,
  },
  signIn: {
    elements: {
      rootBox: "w-full max-w-xl",
    },
  },
  signUp: {
    elements: {
      rootBox: "w-full max-w-xl",
    },
  },
};
