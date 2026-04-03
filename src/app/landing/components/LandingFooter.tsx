import { Link } from "react-router-dom";
import type {
  LandingFooterExploreProvider,
  LandingFooterLink,
  LandingFooterProps,
} from "../types";
import { landingPalette } from "../utils";
import { ExploreAiIcon } from "./ExploreAiIcon";

function FooterWordmarkBubbleLink({ wordmark }: { wordmark: string }) {
  const chars = Array.from(wordmark);
  return (
    <Link
      to="/"
      aria-label={wordmark}
      className="inline-flex w-fit flex-wrap items-center gap-1.5 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
    >
      {chars.map((char, i) => {
        if (char === " ") {
          return <span key={`sp-${i}`} className="w-1.5 shrink-0" aria-hidden />;
        }
        return (
          <span
            key={`${i}-${char}`}
            className="landing-footer-ai-bubble-hitbox landing-footer-wordmark-hitbox grid h-[clamp(2.5rem,4.2vw,3.75rem)] w-[clamp(2.5rem,4.2vw,3.75rem)] shrink-0 place-items-center overflow-visible rounded-full"
          >
            <span
              className="landing-glass-sphere landing-footer-ai-bubble grid h-full w-full place-items-center rounded-full font-mono text-[clamp(1.2rem,2.35vw,2rem)] font-medium uppercase leading-none tracking-tight text-[#26251e]"
              style={{ animationDelay: `${i * 0.55}s` }}
            >
              {char}
            </span>
          </span>
        );
      })}
    </Link>
  );
}

function FooterExploreAiBubbles({ providers }: { providers: readonly LandingFooterExploreProvider[] }) {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {providers.map((p, i) => (
        <a
          key={p.key}
          href={p.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Explore Clawpify on ${p.ariaLabel}`}
          className="landing-footer-ai-bubble-hitbox grid h-7 w-7 shrink-0 place-items-center overflow-visible rounded-full"
        >
          <span
            className="landing-glass-sphere landing-footer-ai-bubble grid h-full w-full place-items-center rounded-full"
            style={{ animationDelay: `${i * 0.55}s` }}
          >
            <ExploreAiIcon name={p.key} />
          </span>
        </a>
      ))}
    </div>
  );
}

function FooterLink({ label, href, external }: LandingFooterLink) {
  const useNative =
    Boolean(external) || href.startsWith("http") || href.startsWith("mailto:");
  const hitboxClass = "landing-footer-nav-bubble-hitbox";
  const bubble = (
    <span className="landing-glass-sphere inline-flex items-center justify-center rounded-full px-2.5 py-1.5 font-mono text-[0.78rem] leading-tight text-current">
      {label}
    </span>
  );
  if (useNative) {
    return (
      <a
        href={href}
        target={href.startsWith("mailto:") ? undefined : "_blank"}
        rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
        className={hitboxClass}
      >
        {bubble}
      </a>
    );
  }
  return (
    <Link to={href} className={hitboxClass}>
      {bubble}
    </Link>
  );
}

export function LandingFooter({
  wordmark,
  tagline,
  copyright,
  navColumns,
  exploreWithAi,
  className = "",
}: LandingFooterProps) {
  return (
    <footer
      className={["relative z-0 mt-auto border-t", className].filter(Boolean).join(" ")}
      style={{
        backgroundColor: landingPalette.pageBackground,
        borderColor: landingPalette.footer.divider,
      }}
    >
      <div className="w-full pb-8">
        <div className="grid w-full grid-cols-1 px-5 pt-10 md:min-h-[190px] md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:items-stretch md:pr-8 md:pl-0 md:pt-0 lg:pr-10 lg:pl-0">
          <div className="hidden flex-col justify-end gap-2 pb-0 md:flex md:pl-6 md:pr-8 md:pt-10 lg:pl-8">
            <FooterWordmarkBubbleLink wordmark={wordmark} />
            <p className="landing-sans-copy max-w-xs text-sm leading-relaxed text-zinc-600">{tagline}</p>
          </div>

          <div
            className="hidden md:block md:w-px md:self-stretch"
            style={{ backgroundColor: landingPalette.footer.divider }}
            aria-hidden
          />

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 md:pl-8 md:grid-cols-5 md:items-start md:gap-x-6 md:gap-y-0 md:pt-10">
            {navColumns.map(({ heading, links }) => (
              <div key={heading}>
                <h4 className="font-mono mb-2.5 text-[0.65rem] font-medium uppercase tracking-widest text-[#8a8378]">
                  {heading}
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {links.map((link) => (
                    <li key={`${heading}-${link.label}`}>
                      <FooterLink {...link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t" style={{ borderColor: landingPalette.footer.divider }} />

        <div className="mt-10 flex flex-col gap-5 px-5 pt-6 sm:flex-row sm:items-center sm:justify-between md:px-8 lg:px-10">
          <p className="landing-sans-copy text-sm text-zinc-600">
            <span className="text-zinc-900">{wordmark}</span>
            <span className="mx-1.5 text-zinc-400" aria-hidden>
              ·
            </span>
            <span>{copyright}</span>
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="landing-sans-copy text-sm text-zinc-500">{exploreWithAi.label}</span>
            <FooterExploreAiBubbles providers={exploreWithAi.providers} />
          </div>
        </div>
      </div>
    </footer>
  );
}
