import { copy } from "../utils/copy";

export function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-bold text-zinc-900">{copy.cta.title}</h2>
        <p className="mt-4 text-zinc-600">{copy.cta.subline}</p>
        <a
          href="https://calendar.notion.so/meet/alhwyn/clawpify"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-lg bg-zinc-900 px-8 py-4 font-medium text-white transition hover:bg-zinc-800"
        >
          {copy.cta.button}
        </a>
      </div>
    </section>
  );
}
