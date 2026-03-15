import { useState } from "react";
import { copy } from "../utils/copy";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { sectionLabel, heading, description, ctaLabel, items } = copy.faq;

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <section className="border-t border-zinc-200 bg-[#f2f3f1] py-16 md:py-24">
      <div className="max-w-screen-2xl px-5 md:px-8 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          {/* Left column */}
          <div className="flex flex-col items-start">
            <span className="font-mono text-xs tracking-wide text-zinc-500">
              {sectionLabel}
            </span>
            <h2 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-zinc-900 md:text-[1.2rem] lg:text-[1.4rem]">
              {heading}
            </h2>
            <p className="mt-3 text-[0.75rem] leading-relaxed text-zinc-600 md:text-[0.8rem]">
              {description}
            </p>
            <a
              href="#"
              className="mt-6 inline-block bg-zinc-900 px-5 py-2.5 font-mono text-[0.7rem] font-medium uppercase tracking-widest text-white transition hover:bg-zinc-800"
            >
              {ctaLabel}
            </a>
          </div>

          {/* Right column - Accordion */}
          <div className="flex flex-col">
            {items.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i} className="border-t border-zinc-200">
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="text-[0.82rem] font-medium text-zinc-900">
                      {item.question}
                    </span>
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-zinc-500 transition-transform">
                      {isOpen ? "\u00d7" : "+"}
                    </span>
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-4 text-[0.75rem] leading-relaxed text-zinc-600">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
