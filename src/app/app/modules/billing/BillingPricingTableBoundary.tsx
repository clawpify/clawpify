import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  billingDisabledFallback: ReactNode;
  /** Shown if the pricing table fails for a reason other than billing being off in Clerk. */
  otherErrorFallback?: ReactNode;
};

type State = { kind: "ok" } | { kind: "billing_disabled" } | { kind: "other" };

function errorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const c = (err as { code?: unknown }).code;
  return typeof c === "string" ? c : undefined;
}

function isClerkBillingDisabledMountError(err: unknown): boolean {
  if (errorCode(err) === "cannot_render_billing_disabled") return true;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("billing is disabled") || msg.includes("cannot_render_billing_disabled");
}

/**
 * `<PricingTable />` throws when Clerk Billing is not enabled for the instance (dev-only notice from Clerk).
 * This boundary shows setup instructions instead of crashing the app.
 */
export class BillingPricingTableBoundary extends Component<Props, State> {
  state: State = { kind: "ok" };

  static getDerivedStateFromError(error: unknown): State {
    if (isClerkBillingDisabledMountError(error)) return { kind: "billing_disabled" };
    return { kind: "other" };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (!isClerkBillingDisabledMountError(error)) {
      console.error("PricingTable error:", error, info.componentStack);
    }
  }

  render() {
    if (this.state.kind === "billing_disabled") return this.props.billingDisabledFallback;
    if (this.state.kind === "other") {
      return this.props.otherErrorFallback ?? (
        <p className="text-sm text-zinc-600">Unable to load plans. Refresh the page or try again.</p>
      );
    }
    return this.props.children;
  }
}
