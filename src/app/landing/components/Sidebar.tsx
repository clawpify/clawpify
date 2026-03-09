import { Link } from "react-router-dom";
import { SignInButton, SignUpButton } from "@clerk/react";
const navLinks = [
  { label: "Dashboard", href: "/app", external: false },
  { label: "Features", href: "#features", external: false },
  { label: "Docs", href: "#", external: true },
  { label: "Pricing", href: "#", external: true },
  { label: "About", href: "#", external: true },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-zinc-200 bg-white p-6">
      <Link to="/" className="mb-10 flex items-center gap-2">
        <div className="h-9 w-9 shrink-0 rounded bg-[#2563eb]" />
        <span className="font-mono text-lg font-medium uppercase tracking-wide text-zinc-900">CLAWPIFY</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navLinks.map(({ label, href, external }) =>
          external ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono flex items-center justify-between py-2 text-sm font-medium uppercase text-zinc-900 transition hover:text-zinc-600"
            >
              {label}
              <span className="text-zinc-400">›</span>
            </a>
          ) : (
            <Link
              key={label}
              to={href}
              className="font-mono flex items-center justify-between py-2 text-sm font-medium uppercase text-zinc-900 transition hover:text-zinc-600"
            >
              {label}
              <span className="text-zinc-400">›</span>
            </Link>
          )
        )}
      </nav>

      <div className="border-t border-zinc-200 pt-6">
        <div className="flex flex-col gap-3">
          <SignUpButton mode="redirect" forceRedirectUrl="/app">
            <button
              type="button"
              className="font-mono w-full rounded-none border border-zinc-900 bg-zinc-900 px-4 py-3 text-sm font-medium uppercase text-white transition hover:bg-zinc-800"
            >
              GET STARTED FOR FREE
            </button>
          </SignUpButton>
          <SignInButton mode="redirect" forceRedirectUrl="/app">
            <button
              type="button"
              className="font-mono block w-full rounded-none border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium uppercase text-zinc-900 transition hover:bg-zinc-100"
            >
              Sign in
            </button>
          </SignInButton>
        </div>
      </div>
    </aside>
  );
}
