import { useState } from "react";
import { Link } from "react-router-dom";
import { SignInButton, SignUpButton } from "@clerk/react";
const productItems = [
  { label: "Open Claw for Shopify", href: "https://clawpify.com", external: true },
  { label: "SEO audit", href: "/audit", external: false },
];

const navLinks = [
  { label: "Pricing", href: "#", external: true },
  { label: "About", href: "/about", external: false },
];

export function Sidebar() {
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col border-r border-zinc-200 bg-[#f2f3f1] transition-[width] duration-200 ease-in-out ${
        isOpen ? "w-72 p-6" : "w-14 p-3"
      }`}
    >
      <div className={`mb-10 flex items-center gap-2 ${isOpen ? "justify-between" : "flex-col"}`}>
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 rounded bg-[#2563eb]" />
          {isOpen && (
            <span className="font-mono text-lg font-medium uppercase text-zinc-900">CLAWPIFY</span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M8 5v14" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <nav className="flex flex-1 flex-col gap-1">
        <div>
          <button
            type="button"
            onClick={() => setProductsExpanded((e) => !e)}
            className="font-mono grid w-full grid-cols-[1fr_1rem] items-center gap-2 py-2 text-left text-sm font-medium uppercase text-zinc-900 transition hover:text-zinc-600"
          >
            Products
            <span
              className={`flex justify-end text-zinc-400 transition-transform ${productsExpanded ? "rotate-90" : "rotate-0"}`}
              aria-hidden
            >
              ›
            </span>
          </button>
          {productsExpanded && (
            <div className="flex flex-col gap-1 pl-2">
              {productItems.map((item) =>
                "external" in item && item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono py-2 text-sm font-medium uppercase text-zinc-600 transition hover:text-zinc-900"
                  >
                    {item.label}
                  </a>
                ) : "href" in item && item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="font-mono py-2 text-sm font-medium uppercase text-zinc-600 transition hover:text-zinc-900"
                  >
                    {item.label}
                  </a>
                ) : null
              )}
            </div>
          )}
        </div>
        {navLinks.map(({ label, href, external }) =>
          external ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono grid w-full grid-cols-[1fr_1rem] items-center gap-2 py-2 text-left text-sm font-medium uppercase text-zinc-900 transition hover:text-zinc-600"
            >
              {label}
              <span className="flex justify-end text-zinc-400">›</span>
            </a>
          ) : (
            <Link
              key={label}
              to={href}
              className="font-mono grid w-full grid-cols-[1fr_1rem] items-center gap-2 py-2 text-left text-sm font-medium uppercase text-zinc-900 transition hover:text-zinc-600"
            >
              {label}
              <span className="flex justify-end text-zinc-400">›</span>
            </Link>
          )
        )}
      </nav>
      )}

      {isOpen && (
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
      )}
    </aside>
  );
}
