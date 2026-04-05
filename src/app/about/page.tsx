import { Link } from "react-router-dom";

const team = [
  { name: "Alhwyn Geonzon", role: "Vibe coder" },
  { name: "Liam Shatzel", role: "Vibe researcher" },
];

const backLinkClass =
  "inline-block font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378] transition hover:text-[#26251e]";

export function AboutPage() {
  return (
    <div className="landing min-h-screen flex flex-col bg-[#f2f3f1]">
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-7 md:px-8 md:pb-20 md:pt-8">
        <Link to="/" className={backLinkClass}>
          ← Back
        </Link>

        <p className="about-mono mb-3 mt-8 text-xs font-medium uppercase tracking-wide text-zinc-500">
          About
        </p>
        <h1 className="about-mono max-w-2xl text-2xl font-medium leading-snug text-zinc-900 md:text-[1.75rem]">
          Software for consignment and resale shops
        </h1>

        <div className="about-mono mt-6 max-w-2xl space-y-4 text-sm leading-relaxed text-zinc-600">
          <p>
            Clawpify is back-office software for consignment and resale: inventory across floor,
            online, and sold; consignor agreements and payout splits; and listing drafts you can
            publish to multiple channels. Connect Shopify, WooCommerce, or your own storefront.
          </p>
          <p>
            We also watch how discovery and checkout surfaces evolve. Protocols like{" "}
            <a
              href="https://ucp.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-700 underline underline-offset-2 transition hover:text-zinc-900"
            >
              Shopify's Universal Commerce Protocol
            </a>{" "}
            and{" "}
            <a
              href="https://docs.stripe.com/agentic-commerce/protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-700 underline underline-offset-2 transition hover:text-zinc-900"
            >
              Stripe's Agentic Commerce Protocol
            </a>{" "}
            describe how agents and apps can discover, recommend, and transact with merchants—that
            context matters as new channels appear; it does not replace running the shop day to day.
          </p>
        </div>

        <section className="mt-14 max-w-2xl border-t border-zinc-200/80 pt-12">
          <h2 className="about-mono text-xs font-medium uppercase tracking-wide text-zinc-500">
            Team
          </h2>
          <ul className="mt-6 space-y-6">
            {team.map((person) => (
              <li key={person.name} className="pb-6 last:pb-0">
                <h3 className="hero-headline text-lg font-medium text-zinc-900">{person.name}</h3>
                <p className="about-mono mt-0.5 text-sm text-zinc-600">{person.role}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
