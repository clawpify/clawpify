import { Link } from "react-router-dom";
import { Sidebar } from "../landing/components/Sidebar";

const team = [
  { name: "Alhwyn Geonzon", role: "Vibe coder" },
  { name: "Liam Shatzel", role: "Vibe researcher" },
];

export function AboutPage() {
  return (
    <div className="landing flex min-h-screen bg-[#f2f3f1]">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <div className="shrink-0 px-6 pt-9 pb-12 md:px-10 md:pt-9 md:pb-16 lg:px-12">
          <Link
            to="/"
            className="about-mono mb-8 inline-block text-sm font-medium uppercase tracking-wide text-zinc-600 transition hover:text-zinc-900"
          >
            ← Back
          </Link>
          <p className="about-mono mt-4 max-w-2xl text-lg text-zinc-600">
            Agents are opening new sales channels for commerce. Protocols like{" "}
            <a
              href="https://ucp.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition hover:text-zinc-900"
            >
              Shopify's Universal Commerce Protocol
            </a>{" "}
            and{" "}
            <a
              href="https://docs.stripe.com/agentic-commerce/protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition hover:text-zinc-900"
            >
              Stripe's Agentic Commerce Protocol
            </a>{" "}
            are defining how AI agents discover, recommend, and transact with merchants.
          </p>
          <p className="about-mono mt-4 max-w-2xl text-lg text-zinc-600">
            We're building Clawpify to bring discovery into this agent economy—and we're ready for
            ecommerce.
          </p>
        </div>
        <main className="flex-1 overflow-y-auto px-6 md:px-10 lg:px-12">
          <section className="max-w-2xl">
            <h2 className="about-mono text-sm font-medium uppercase tracking-wide text-zinc-500">
              Team
            </h2>
            <ul className="mt-6 space-y-8">
              {team.map((person) => (
                <li key={person.name} className="pb-8 last:pb-0">
                  <h3 className="hero-headline text-xl font-medium text-zinc-900">{person.name}</h3>
                  <p className="about-mono mt-1 text-zinc-600">{person.role}</p>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
