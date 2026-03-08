import { copy } from "../utils/copy";

export function Testimonials() {
  return (
    <section className="bg-zinc-50/50 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="grid gap-8 md:grid-cols-2">
          {copy.testimonials.map(({ quote, author, role, company }) => (
            <blockquote
              key={author}
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <p className="text-zinc-600">&ldquo;{quote}&rdquo;</p>
              <footer className="mt-4">
                <cite className="not-italic">
                  <span className="font-medium text-zinc-900">{author}</span>
                  <span className="text-zinc-500">
                    {" "}
                    — {role}, {company}
                  </span>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
