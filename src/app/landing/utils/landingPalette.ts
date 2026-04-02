import { aquaOrangeTheme } from "./aquaOrangeTheme";

export const landingAccentOrange = aquaOrangeTheme;

const panelInset = "rgba(255, 255, 255, 0.9)";

export const landingPalette = {
  pageBackground: "#edeef0",
  mainPanel: {
    background: "linear-gradient(180deg, #f8f8f7 0%, #f1f1ef 45%, #ebebea 100%)",
    border: "rgba(120, 120, 118, 0.35)",
    boxShadow: [
      `inset 0 1px 0 0 ${panelInset}`,
      "inset 0 -1px 0 0 rgba(0, 0, 0, 0.06)",
    ].join(", "),
  },
  footer: {
    background: "#e8e9e7",
    divider: "rgba(90, 88, 82, 0.2)",
    swatch: "#26251e",
  },
} as const;
