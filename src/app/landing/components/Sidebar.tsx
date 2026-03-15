import { useState } from "react";
import { Link } from "react-router-dom";
const productItems = [
  { label: "Open Claw for Shopify", href: "https://clawpify.com", external: true },
  { label: "Query ChatGPT", href: "/audit", external: false },
];

const developerItems = [
  { label: "GitHub", href: "https://github.com/clawpify", external: true },
];

const navLinks = [
  { label: "About", href: "/about", external: false },
  { label: "Writing", href: "/blog", external: false },
];

function SidebarInner({ isOpen, setIsOpen, hidePanelToggle }: { isOpen: boolean; setIsOpen: (fn: (o: boolean) => boolean) => void; hidePanelToggle?: boolean }) {
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [developersExpanded, setDevelopersExpanded] = useState(false);

  return (
    <>
      <header className={`mb-8 flex items-center gap-1.5 ${isOpen ? "justify-between" : "flex-col"}`}>
        <Link to="/" className="flex items-center gap-1.5" aria-label="Clawpify home">
          <div className="h-7 w-7 shrink-0 bg-[#b5ddfb]" />
          {isOpen && (
            <span className="text-base font-medium uppercase text-zinc-900">CLAWPIFY</span>
          )}
        </Link>
        {!hidePanelToggle && (
          <button
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg
              width="16"
              height="16"
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
        )}
      </header>

      {isOpen && (
        <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        <div>
          <button
            type="button"
            onClick={() => setProductsExpanded((e) => !e)}
            aria-expanded={productsExpanded}
            className="grid w-full grid-cols-[1fr_0.75rem] items-center gap-1.5 py-1.5 text-left text-xs font-medium uppercase text-zinc-900 transition hover:text-zinc-600"
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
            <div className="flex flex-col gap-0.5 pl-1.5">
              {productItems.map((item) => {
                const linkClass =
                  "py-1.5 text-xs font-medium uppercase text-zinc-600 transition hover:text-zinc-900 flex items-center gap-1.5";
                const content = item.label;
                return item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {content}
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                ) : item.href ? (
                  <Link key={item.label} to={item.href} className={linkClass}>
                    {content}
                  </Link>
                ) : null;
              })}
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => setDevelopersExpanded((e) => !e)}
            aria-expanded={developersExpanded}
            className="grid w-full grid-cols-[1fr_0.75rem] items-center gap-1.5 py-1.5 text-left text-xs font-medium uppercase text-zinc-900 transition hover:text-zinc-600"
          >
            Developers
            <span
              className={`flex justify-end text-zinc-400 transition-transform ${developersExpanded ? "rotate-90" : "rotate-0"}`}
              aria-hidden
            >
              ›
            </span>
          </button>
          {developersExpanded && (
            <div className="flex flex-col gap-0.5 pl-1.5">
              {developerItems.map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 text-xs font-medium uppercase text-zinc-600 transition hover:text-zinc-900"
                  >
                    {item.label}
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="py-1.5 text-xs font-medium uppercase text-zinc-600 transition hover:text-zinc-900"
                  >
                    {item.label}
                  </Link>
                )
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
              className="grid w-full grid-cols-[1fr_0.75rem] items-center gap-1.5 py-1.5 text-left text-xs font-medium uppercase text-zinc-900 transition hover:text-zinc-600"
            >
              {label}
              <span className="sr-only"> (opens in new tab)</span>
              <span className="flex justify-end text-zinc-400" aria-hidden>›</span>
            </a>
          ) : (
            <Link
              key={label}
              to={href}
              className="grid w-full grid-cols-[1fr_0.75rem] items-center gap-1.5 py-1.5 text-left text-xs font-medium uppercase text-zinc-900 transition hover:text-zinc-600"
            >
              {label}
              <span className="flex justify-end text-zinc-400">›</span>
            </Link>
          )
        )}
      </nav>
      )}

      {isOpen && (
      <div className="border-t border-zinc-200 pt-5">
        <div className="flex flex-col gap-2">
          <a
            href="https://calendar.notion.so/meet/alhwyn/clawpify"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-none border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-center text-xs font-medium uppercase text-white transition hover:bg-zinc-800 hover:border-zinc-800"
          >
            BOOK A CALL
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          <Link
            to="/sign-in"
            className="block w-full rounded-none border border-zinc-200 bg-transparent px-3 py-2.5 text-center text-xs font-medium uppercase text-[#26251e] transition hover:border-[#26251e] hover:bg-[#26251e] hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
      )}
    </>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center bg-white/90 shadow-sm backdrop-blur-sm border border-black/10 md:hidden"
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-label="Navigation menu">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 cursor-default"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <aside className="relative z-10 flex h-full w-64 flex-col bg-[#f2f3f1] p-5 shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-zinc-500 hover:text-zinc-900"
              aria-label="Close menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <SidebarInner isOpen={true} setIsOpen={setIsOpen} hidePanelToggle />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen flex-col border-r border-zinc-200 bg-[#f2f3f1] transition-[width] duration-200 ease-in-out md:flex ${
          isOpen ? "w-56 p-5" : "w-12 p-2.5"
        }`}
      >
        <SidebarInner isOpen={isOpen} setIsOpen={setIsOpen} />
      </aside>
    </>
  );
}
