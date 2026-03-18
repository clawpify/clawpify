import type { ReactNode } from "react";

type AppShellProps = {
  fullBleed: boolean;
  children: ReactNode;
};

export function AppShell({ fullBleed, children }: AppShellProps) {
  return (
    <div
      className={
        fullBleed
          ? "min-h-screen bg-[#edeef0]"
          : "min-h-screen bg-[#f2f3f1] p-6"
      }
    >
      {children}
    </div>
  );
}
