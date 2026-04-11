import { PricingTable } from "@clerk/react";
import { useEffect, useMemo, useRef } from "react";
import { clerkAppearance } from "../../../../lib/clerk-appearance.ts";
import { containerChromeStyle } from "@/components/Container.tsx";
import { copy } from "../../utils/copy";
import { BillingPricingTableBoundary } from "./BillingPricingTableBoundary.tsx";

function PricingTableFallback() {
  return (
    <div
      className="min-h-[280px] animate-pulse rounded-lg bg-zinc-100/80"
      aria-busy
      aria-label={copy.billing.pricingLoadingAria}
    />
  );
}

function BillingDisabledNotice() {
  return (
    <div className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-5 py-4 text-sm">
      <p className="font-medium text-amber-950">{copy.billing.billingDisabledTitle}</p>
      <p className="mt-2 leading-relaxed text-amber-900/90">{copy.billing.billingDisabledBody}</p>
      <a
        href="https://dashboard.clerk.com/last-active?path=billing/settings"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex font-medium text-amber-950 underline decoration-amber-700/50 underline-offset-2 hover:decoration-amber-950"
      >
        {copy.billing.billingDisabledCta}
      </a>
    </div>
  );
}

/** Workspace primary — matches `clerkAppearance` blue CTAs, not the landing orange pill. */
const PRICING_CTA_WORKSPACE_CLASS = [
  "inline-flex min-w-[10rem] items-center justify-center rounded-md px-6 py-2.5 text-center text-sm font-medium text-white no-underline",
  "border border-blue-700/30 bg-blue-600 shadow-sm",
  "transition-[filter,box-shadow] hover:brightness-105 active:brightness-95",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-45",
].join(" ");

const PRICING_CTA_WORKSPACE_STYLE = {
  background: String(clerkAppearance.variables.colorPrimary),
  borderColor: "#1d4ed8",
  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  color: String(clerkAppearance.variables.colorPrimaryForeground),
} as const;

const PRICING_CTA_LABEL_MARKER = "clawpify-pricing-cta-label";

function ensurePricingCtaLabelSpan(button: HTMLButtonElement) {
  if (button.querySelector(`:scope > span.${PRICING_CTA_LABEL_MARKER}`)) return;
  const span = document.createElement("span");
  span.className = `${PRICING_CTA_LABEL_MARKER} relative z-[2]`;
  while (button.firstChild) span.appendChild(button.firstChild);
  button.appendChild(span);
}

/** Solid workspace primary — overrides Clerk’s pricing CTA inline styles so it matches auth/workspace, not marketing. */
function applyPricingFooterButtonSurface(button: HTMLButtonElement) {
  const clerkClasses = Array.from(button.classList).filter((c) => c.startsWith("cl-"));
  button.className = [PRICING_CTA_WORKSPACE_CLASS, ...clerkClasses].join(" ");

  button.style.setProperty("background", PRICING_CTA_WORKSPACE_STYLE.background, "important");
  button.style.setProperty("border-color", PRICING_CTA_WORKSPACE_STYLE.borderColor, "important");
  button.style.setProperty("box-shadow", PRICING_CTA_WORKSPACE_STYLE.boxShadow, "important");
  button.style.setProperty("color", PRICING_CTA_WORKSPACE_STYLE.color, "important");

  ensurePricingCtaLabelSpan(button);
}

/** Same frosted chrome as landing `FeaturesSection` / `Container` (liquid glass inner panel). */
const PRICING_CARD_GLASS_CLASS = [
  "relative isolate min-w-0 overflow-hidden rounded-2xl border",
  "backdrop-blur-2xl backdrop-saturate-[180%]",
  "text-zinc-900",
].join(" ");

const PRICING_CARD_INNER_SECTION_SELECTORS = [
  "div.cl-pricingTableCardHeader",
  "div.cl-pricingTableCardBody",
  "div.cl-pricingTableCardFeatures",
  "div.cl-pricingTableCardFooter",
] as const;

function applyPricingCardGlass(card: HTMLElement) {
  const clerkClasses = Array.from(card.classList).filter((c) => c.startsWith("cl-"));
  card.className = [PRICING_CARD_GLASS_CLASS, ...clerkClasses].join(" ");

  const { background, borderColor, boxShadow } = containerChromeStyle;
  if (background != null) card.style.setProperty("background", String(background), "important");
  if (borderColor != null) card.style.setProperty("border-color", String(borderColor), "important");
  if (boxShadow != null) card.style.setProperty("box-shadow", String(boxShadow), "important");
}

function stylePricingCardInnerSections(root: HTMLElement) {
  for (const sel of PRICING_CARD_INNER_SECTION_SELECTORS) {
    root.querySelectorAll(sel).forEach((node) => {
      const el = node as HTMLElement;
      el.style.setProperty("background", "transparent", "important");
      el.style.setProperty("box-shadow", "none", "important");
    });
  }
}

function stylePricingTableCards(root: HTMLElement) {
  root.querySelectorAll("div.cl-pricingTableCard").forEach((node) => {
    applyPricingCardGlass(node as HTMLElement);
  });
}

function stylePricingFooterButtons(root: HTMLElement) {
  const buttons = root.querySelectorAll("button.cl-pricingTableCardFooterButton");
  buttons.forEach((node) => applyPricingFooterButtonSurface(node as HTMLButtonElement));
}

function stylePricingTableClawpify(root: HTMLElement) {
  stylePricingTableCards(root);
  stylePricingCardInnerSections(root);
  stylePricingFooterButtons(root);
}

type OrganizationPricingTablePanelProps = {
  /** Extra classes on the outer panel (e.g. max width on home). */
  className?: string;
  /** Defaults to origin + `/app/billing`. */
  newSubscriptionRedirectUrl?: string;
};

/**
 * Clerk `<PricingTable for="organization" />` with shared styling and billing-disabled boundary.
 */
export function OrganizationPricingTablePanel({
  className = "",
  newSubscriptionRedirectUrl: redirectOverride,
}: OrganizationPricingTablePanelProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const newSubscriptionRedirectUrl = useMemo(() => {
    if (redirectOverride) return redirectOverride;
    if (typeof window === "undefined") return "/app/billing";
    return `${window.location.origin}/app/billing`;
  }, [redirectOverride]);

  const pricingAppearance = useMemo(
    () => ({
      variables: clerkAppearance.variables,
      elements: {
        ...clerkAppearance.elements,
        rootBox: "w-full",
      },
    }),
    [],
  );

  useEffect(() => {
    const root = mountRef.current;
    if (!root) return;

    const observeOpts: MutationObserverInit = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    };

    // Must disconnect before mutating class/style, or our own updates retrigger the observer and freeze the tab.
    const obs = new MutationObserver(() => {
      obs.disconnect();
      stylePricingTableClawpify(root);
      obs.observe(root, observeOpts);
    });

    stylePricingTableClawpify(root);
    obs.observe(root, observeOpts);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={mountRef}
      className={`rounded-xl border border-zinc-200/80 bg-[#fafafa] p-6 shadow-sm ${className}`.trim()}
      style={{ fontFamily: "var(--workspace-font)" }}
    >
      <BillingPricingTableBoundary billingDisabledFallback={<BillingDisabledNotice />}>
        <PricingTable
          for="organization"
          appearance={pricingAppearance}
          newSubscriptionRedirectUrl={newSubscriptionRedirectUrl}
          ctaPosition="bottom"
          collapseFeatures={false}
          fallback={<PricingTableFallback />}
        />
      </BillingPricingTableBoundary>
    </div>
  );
}
