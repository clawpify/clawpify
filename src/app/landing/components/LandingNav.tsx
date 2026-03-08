import { Link } from "react-router-dom";
import { Show, SignInButton, UserButton } from "@clerk/react";

import logo from "../../../logo.svg";

const navLinks = [
  { label: "features", href: "#features" },
  { label: "pricing", href: "#pricing" },
  { label: "about", href: "#about" },
  { label: "blog", href: "#blog" },
];

export function LandingNav() {
  return (
    <div className="sticky top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between bg-white/90 px-6 py-4 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo}
            alt="Clawpify"
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="text-lg font-semibold text-zinc-900">Clawpify</span>
        </Link>
        <div className="flex items-center gap-6">
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className="text-sm font-medium uppercase tracking-wide text-zinc-600 transition hover:text-zinc-900"
            >
              {label}
            </Link>
          ))}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-zinc-800"
              >
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link
              to="/dashboard"
              className="text-sm font-medium uppercase tracking-wide text-zinc-600 transition hover:text-zinc-900"
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </Show>
        </div>
      </nav>
    </div>
  );
}
