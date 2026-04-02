import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children?: ReactNode;
  variant?: "default" | "heroSky";
};
