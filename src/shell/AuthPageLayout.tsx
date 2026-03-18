import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type AuthPageLayoutProps = {
  children: ReactNode;
};

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f2f3f1] p-6">
      <Link
        to="/"
        className="absolute left-6 top-6 font-mono text-sm font-medium uppercase text-zinc-600 transition hover:text-zinc-900"
      >
        ← Back
      </Link>
      {children}
    </div>
  );
}
