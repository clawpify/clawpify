const insetLite = "rgba(255, 255, 255, 0.85)";
const insetDark = "rgba(0, 0, 0, 0.06)";
const rimGray = "#6b6b69";

export const vintageChromeTheme = {
  pageBase: "#f0f0ee",
  pinstripe: `repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(0, 0, 0, 0.045) 3px,
    rgba(0, 0, 0, 0.045) 4px
  )`,
  hero: {
    gradient:
      "linear-gradient(180deg, #ffffff 0%, #ececea 35%, #dededc 70%, #d2d2cf 100%)",
    border: rimGray,
    boxShadow: [
      `inset 0 1px 0 0 ${insetLite}`,
      `inset 0 -1px 0 0 ${insetDark}`,
      "0 2px 6px rgba(0, 0, 0, 0.06)",
      "0 6px 20px rgba(0, 0, 0, 0.06)",
    ].join(", "),
  },
  navBar: {
    gradient:
      "linear-gradient(180deg, #ffffff 0%, #f4f4f1 28%, #e2e2de 62%, #d4d4cf 100%)",
    border: rimGray,
    boxShadow: [
      `inset 0 1px 0 0 ${insetLite}`,
      `inset 0 -1px 0 0 rgba(0, 0, 0, 0.14)`,
      "0 2px 4px rgba(0, 0, 0, 0.06)",
      "0 6px 18px rgba(0, 0, 0, 0.1)",
      "0 1px 0 rgba(255, 255, 255, 0.55)",
    ].join(", "),
  },
  tabCard: {
    gradient:
      "linear-gradient(180deg, #fafaf9 0%, #e8e8e5 38%, #d6d6d2 78%, #c9c9c5 100%)",
    border: rimGray,
    boxShadow: [
      `inset 0 1px 0 0 ${insetLite}`,
      `inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)`,
      "0 3px 8px rgba(0, 0, 0, 0.08)",
      "0 1px 2px rgba(0, 0, 0, 0.06)",
    ].join(", "),
  },
  footerBar: {
    gradient: "linear-gradient(180deg, #ebebe9 0%, #e3e3e0 100%)",
    borderTop: "#b4b4b0",
    boxShadow: [`inset 0 1px 0 0 ${insetLite}`].join(", "),
  },
} as const;
