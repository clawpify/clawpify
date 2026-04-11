import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children?: ReactNode;
  /** Glossy orange pill (default). Use `heroSky` for the blue hero CTA. */
  variant?: "orange" | "heroSky";
};
