import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";

/**
 * Light liquid glass: bright frosted translucency, strong backdrop blur/saturation,
 * specular top rim, soft neutral lift. Put your own inner UI in children.
 */
export type ContainerProps = {
  children: React.ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "className">;

export const containerChromeStyle: CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.58) 0%, rgba(248, 250, 252, 0.38) 42%, rgba(255, 255, 255, 0.3) 100%)",
  borderColor: "rgba(255, 255, 255, 0.72)",
  boxShadow: [
    "inset 0 1px 0 0 rgba(255, 255, 255, 0.95)",
    "inset 0 -1px 0 0 rgba(255, 255, 255, 0.35)",
    "inset 0 -2px 0 0 rgba(0, 0, 0, 0.04)",
    "0 1px 0 rgba(255, 255, 255, 0.8)",
    "0 12px 32px rgba(0, 0, 0, 0.06)",
    "0 4px 12px rgba(0, 0, 0, 0.05)",
  ].join(", "),
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { children, className = "", style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        "relative isolate min-w-0 rounded-3xl border px-8 py-[100px] md:px-10 lg:px-12",
        "backdrop-blur-2xl backdrop-saturate-[180%]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ...containerChromeStyle, ...style }}
      {...props}
    >
      {children}
    </div>
  );
});

Container.displayName = "Container";
