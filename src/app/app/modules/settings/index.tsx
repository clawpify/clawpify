import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthenticatedFetch } from "../../../../lib/api";
import { messageFromErrorBody } from "../../../../lib/messageFromErrorBody";
import { useToast } from "../../../../lib/toast";
import { SettingsIcon } from "../../../../icons/workspace-icons";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { copy } from "../../utils/copy";
import {
  ebayOAuthStartPath,
  ebayOAuthStatusPath,
  ebayPoliciesPath,
  ebayPolicyDefaultsPath,
} from "@/utils/networkFns";
import type {
  EbayPoliciesResponse,
  EbayPolicyDefaults,
  SaveEbayPolicyDefaultsRequest,
} from "../products/types";
import {
  landingOrangeBubbleClassName,
  landingOrangeBubbleStyle,
} from "../../../landing/components/Button";

type EbayStatus = "loading" | "connected" | "disconnected";
const MARKETPLACE_ID = "EBAY_US";

const SETTINGS_HEADER_CONTEXT = copy.settings.title;
const SETTINGS_HEADER_CONFIG = {
  context: SETTINGS_HEADER_CONTEXT,
  contextIcon: (
    <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-200 text-zinc-700">
      <SettingsIcon size={14} className="text-current" />
    </span>
  ),
};

async function readJsonOrError<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new Error(messageFromErrorBody(body) ?? `Request failed: ${res.status}`);
  }
  return body as T;
}

export function SettingsPage() {
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig(SETTINGS_HEADER_CONFIG);

    return () =>
      setConfig((current) =>
        current.context === SETTINGS_HEADER_CONTEXT ? {} : current
      );
  }, [setConfig]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-zinc-500">{copy.settings.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
            {copy.settings.integrationsTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            {copy.settings.integrationsBody}
          </p>
        </div>

        <section
          className="rounded-xl border border-zinc-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)]"
          aria-label={copy.settings.integrationsTitle}
        >
          <EbayIntegrationCard />
        </section>
      </div>
    </main>
  );
}

function EbayIntegrationCard() {
  const fetchAuth = useAuthenticatedFetch();
  const { showToast } = useToast();
  const [status, setStatus] = useState<EbayStatus>("loading");
  const [connectLoading, setConnectLoading] = useState(false);
  const [policies, setPolicies] = useState<EbayPoliciesResponse | null>(null);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesSaving, setPoliciesSaving] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [fulfillmentPolicyId, setFulfillmentPolicyId] = useState("");
  const [paymentPolicyId, setPaymentPolicyId] = useState("");
  const [returnPolicyId, setReturnPolicyId] = useState("");
  const [merchantLocationKey, setMerchantLocationKey] = useState("");
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyDefaults = useCallback((next: EbayPoliciesResponse) => {
    setFulfillmentPolicyId(
      next.defaults?.fulfillment_policy_id || next.fulfillment_policies[0]?.id || ""
    );
    setPaymentPolicyId(next.defaults?.payment_policy_id || next.payment_policies[0]?.id || "");
    setReturnPolicyId(next.defaults?.return_policy_id || next.return_policies[0]?.id || "");
    setMerchantLocationKey(next.defaults?.merchant_location_key || next.locations[0]?.key || "");
  }, []);

  const refreshStatus = useCallback(async (opts?: { quiet?: boolean }): Promise<EbayStatus> => {
    if (!opts?.quiet) setStatus("loading");
    const res = await fetchAuth(ebayOAuthStatusPath);
    if (res.ok) {
      const data = (await res.json().catch(() => null)) as { connected?: boolean } | null;
      const next = data?.connected ? "connected" : "disconnected";
      setStatus(next);
      return next;
    }
    setStatus("disconnected");
    return "disconnected";
  }, [fetchAuth]);

  const clearStatusPoll = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const loadPolicies = useCallback(async () => {
    setPoliciesLoading(true);
    setPolicyError(null);
    try {
      const res = await fetchAuth(ebayPoliciesPath(MARKETPLACE_ID));
      const next = await readJsonOrError<EbayPoliciesResponse>(res);
      setPolicies(next);
      applyDefaults(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load eBay policies";
      setPolicyError(msg);
      showToast(msg);
    } finally {
      setPoliciesLoading(false);
    }
  }, [applyDefaults, fetchAuth, showToast]);

  const startStatusPoll = useCallback(() => {
    clearStatusPoll();
    const stopAt = Date.now() + 60_000;
    const tick = async () => {
      const next = await refreshStatus({ quiet: true }).catch(() => "disconnected" as EbayStatus);
      if (next === "connected" || Date.now() >= stopAt) clearStatusPoll();
    };
    void tick();
    pollTimerRef.current = setInterval(() => void tick(), 2_000);
  }, [clearStatusPoll, refreshStatus]);

  useEffect(() => {
    void refreshStatus();
    const onFocus = () => void refreshStatus({ quiet: true });
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshStatus({ quiet: true });
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshStatus]);

  useEffect(() => {
    if (status === "connected") void loadPolicies();
    if (status === "disconnected") {
      setPolicies(null);
      setPolicyError(null);
    }
  }, [loadPolicies, status]);

  useEffect(() => clearStatusPoll, [clearStatusPoll]);

  const onConnect = useCallback(async () => {
    setConnectLoading(true);
    try {
      const res = await fetchAuth(ebayOAuthStartPath);
      const payload = await res.json().catch(() => undefined);

      if (res.ok && payload && typeof payload === "object" && "url" in payload) {
        const url =
          typeof (payload as { url?: unknown }).url === "string"
            ? (payload as { url: string }).url.trim()
            : "";

        if (url) {
          window.location.assign(url);
          startStatusPoll();
          return;
        }
      }

      if (res.status === 401) {
        showToast(copy.settings.ebayConnectSignIn);
        return;
      }

      const msg = messageFromErrorBody(payload) ?? `Could not start eBay link (${res.status})`;
      showToast(msg);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not start eBay link");
    } finally {
      setConnectLoading(false);
    }
  }, [fetchAuth, showToast, startStatusPoll]);

  const onSavePolicies = useCallback(async () => {
    const body: SaveEbayPolicyDefaultsRequest = {
      marketplace_id: MARKETPLACE_ID,
      fulfillment_policy_id: fulfillmentPolicyId,
      payment_policy_id: paymentPolicyId,
      return_policy_id: returnPolicyId,
      merchant_location_key: merchantLocationKey || null,
    };

    setPoliciesSaving(true);
    setPolicyError(null);
    try {
      const res = await fetchAuth(ebayPolicyDefaultsPath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const saved = await readJsonOrError<EbayPolicyDefaults>(res);
      setPolicies((current) => (current ? { ...current, defaults: saved } : current));
      showToast("eBay listing defaults saved.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save eBay listing defaults";
      setPolicyError(msg);
      showToast(msg);
    } finally {
      setPoliciesSaving(false);
    }
  }, [
    fetchAuth,
    fulfillmentPolicyId,
    merchantLocationKey,
    paymentPolicyId,
    returnPolicyId,
    showToast,
  ]);

  const connected = status === "connected";
  const canSavePolicies =
    connected &&
    !policiesSaving &&
    Boolean(fulfillmentPolicyId && paymentPolicyId && returnPolicyId);
  const statusText =
    status === "loading"
      ? copy.settings.integrationStatusChecking
      : connected
        ? copy.settings.integrationStatusConnected
        : copy.settings.integrationStatusDisconnected;

  return (
    <div className="p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-sm font-semibold text-white">
              eBay
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-950">{copy.settings.ebayTitle}</h2>
              <p className="mt-0.5 text-sm text-zinc-600">{copy.settings.ebayBody}</p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600">
            <span
              className={`size-2 rounded-full ${
                connected ? "bg-emerald-500" : status === "loading" ? "bg-zinc-300" : "bg-zinc-400"
              }`}
              aria-hidden
            />
            {statusText}
          </div>
        </div>

        <button
          type="button"
          disabled={connectLoading || status === "loading"}
          onClick={onConnect}
          className={[
            landingOrangeBubbleClassName,
            "landing-sans-copy inline-flex w-full items-center justify-center px-6 py-3 text-center text-[13px] font-semibold no-underline disabled:pointer-events-none sm:w-auto",
          ].join(" ")}
          style={landingOrangeBubbleStyle}
        >
          <span className="relative z-[2]">
            {connected ? copy.settings.ebayReconnect : copy.settings.ebayConnect}
          </span>
        </button>
      </div>

      {connected ? (
        <div className="mt-5 border-t border-zinc-100 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">Listing Details</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
                Choose the default eBay business policies Clawpify should use when creating
                listing drafts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadPolicies()}
              disabled={policiesLoading}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {policiesLoading ? "Refreshing..." : "Refresh policies"}
            </button>
          </div>

          {policies?.missing.length ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Missing from eBay: {policies.missing.join(", ")}. Create the missing setup in eBay,
              then refresh policies.
            </p>
          ) : null}
          {policyError ? (
            <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {policyError}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-700">Shipping policy</span>
              <select
                value={fulfillmentPolicyId}
                onChange={(e) => setFulfillmentPolicyId(e.target.value)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
              >
                <option value="">Select shipping policy</option>
                {policies?.fulfillment_policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-700">Payment policy</span>
              <select
                value={paymentPolicyId}
                onChange={(e) => setPaymentPolicyId(e.target.value)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
              >
                <option value="">Select payment policy</option>
                {policies?.payment_policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-700">Return policy</span>
              <select
                value={returnPolicyId}
                onChange={(e) => setReturnPolicyId(e.target.value)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
              >
                <option value="">Select return policy</option>
                {policies?.return_policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-700">Inventory location</span>
              <select
                value={merchantLocationKey}
                onChange={(e) => setMerchantLocationKey(e.target.value)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
              >
                <option value="">No default location</option>
                {policies?.locations.map((location) => (
                  <option key={location.key} value={location.key}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={!canSavePolicies}
              onClick={() => void onSavePolicies()}
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {policiesSaving ? "Saving..." : "Save listing defaults"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}