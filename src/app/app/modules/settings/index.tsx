import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthenticatedFetch } from "../../../../lib/api";
import { messageFromErrorBody } from "../../../../lib/messageFromErrorBody";
import { readJsonOrError } from "../../../../lib/readJsonOrError";
import { useToast } from "../../../../lib/toast";
import { SettingsIcon } from "../../../../icons/workspace-icons";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { copy } from "../../utils/copy";
import {
  ebayLocationsPath,
  ebayOAuthStartPath,
  ebayOAuthStatusPath,
  ebayPoliciesPath,
  ebayPolicyDefaultsPath,
} from "@/utils/networkFns";
import type {
  CreateEbayLocationRequest,
  EbayLocationOption,
  EbayPoliciesResponse,
  EbayPolicyDefaults,
  SaveEbayPolicyDefaultsRequest,
} from "../products/types";
import {
  orangeBubbleClassName,
  orangeBubbleStyle,
} from "@/components/buttonSurface";
import type { EbaySetupHint, EbayStatus } from "./types";

const MARKETPLACE_ID = "EBAY_US";
const EBAY_BUSINESS_POLICIES_URL = "https://www.ebay.com/bp/manage";
const INITIAL_EBAY_LOCATION_FORM: CreateEbayLocationRequest = {
  name: "Clawpify Ship From",
  address_line1: "",
  city: "",
  state_or_province: "",
  postal_code: "",
  country: "US",
};

const SETTINGS_HEADER_CONTEXT = copy.settings.title;
const SETTINGS_HEADER_CONFIG = {
  context: SETTINGS_HEADER_CONTEXT,
  contextIcon: (
    <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-200 text-zinc-700">
      <SettingsIcon size={14} className="text-current" />
    </span>
  ),
};

// Build a setup warning that keeps eBay policies separate from inventory locations.
function ebayPolicySetupHint(policies: EbayPoliciesResponse): EbaySetupHint | null {
  if (!policies.missing.length) return null;
  const counts = policies.counts ?? {
    fulfillment: policies.fulfillment_policies.length,
    payment: policies.payment_policies.length,
    returns: policies.return_policies.length,
    locations: policies.locations.length,
  };
  const allEmpty =
    counts.fulfillment === 0 &&
    counts.payment === 0 &&
    counts.returns === 0 &&
    counts.locations === 0;

  if (allEmpty) {
    return {
      message: `eBay returned 0 business policy and ship-from location records for ${policies.marketplace_id}. Make sure the connected eBay account is the same Seller Hub account, policies exist for this marketplace, and create a ship-from location below.`,
      showBusinessPoliciesLink: true,
    };
  }

  // eBay stores ship-from locations in Inventory API, separate from Account API policies.
  const missingBusinessPolicies = policies.missing.filter(
    (item) => item !== "inventory location"
  );
  const missingInventoryLocation = policies.missing.includes("inventory location");
  const parts: string[] = [];

  if (missingBusinessPolicies.length) {
    parts.push(
      `Missing eBay business policies for ${policies.marketplace_id}: ${missingBusinessPolicies.join(", ")}.`
    );
  }
  if (missingInventoryLocation) {
    parts.push(
      `Missing ship-from location for ${policies.marketplace_id}. Create one below, then save listing defaults.`
    );
  }
  parts.push("Business policies and inventory locations are separate eBay setup items.");

  return {
    message: parts.join(" "),
    showBusinessPoliciesLink: missingBusinessPolicies.length > 0,
  };
}

function EbayListingDefaultsGuide() {
  return (
    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-3 text-sm text-blue-950">
      <p className="font-medium">Setup guide</p>
      <ol className="mt-2 grid gap-1.5 pl-4 text-blue-900">
        <li className="list-decimal">
          Create shipping, payment, and return policies in{" "}
          <a
            href={EBAY_BUSINESS_POLICIES_URL}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline decoration-blue-500 underline-offset-2"
          >
            eBay business policies
          </a>
          .
        </li>
        <li className="list-decimal">
          If no ship-from location appears, create one below for this connected eBay
          account.
        </li>
        <li className="list-decimal">
          Click Refresh setup, choose each default here, then save listing defaults.
        </li>
      </ol>
    </div>
  );
}

// Render workspace settings and attach the settings header context.
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

// Manage eBay connection state and default listing setup.
function EbayIntegrationCard() {
  const fetchAuth = useAuthenticatedFetch();
  const { showToast } = useToast();
  const [status, setStatus] = useState<EbayStatus>("loading");
  const [connectLoading, setConnectLoading] = useState(false);
  const [policies, setPolicies] = useState<EbayPoliciesResponse | null>(null);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesSaving, setPoliciesSaving] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [fulfillmentPolicyId, setFulfillmentPolicyId] = useState("");
  const [paymentPolicyId, setPaymentPolicyId] = useState("");
  const [returnPolicyId, setReturnPolicyId] = useState("");
  const [merchantLocationKey, setMerchantLocationKey] = useState("");
  const [locationForm, setLocationForm] = useState<CreateEbayLocationRequest>(
    INITIAL_EBAY_LOCATION_FORM
  );
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Apply the default policies and inventory location to the UI.
   * @param next - The eBay policies response from the API.
   */
  const applyDefaults = useCallback((next: EbayPoliciesResponse) => {
    setFulfillmentPolicyId(
      next.defaults?.fulfillment_policy_id || next.fulfillment_policies[0]?.id || ""
    );
    setPaymentPolicyId(next.defaults?.payment_policy_id || next.payment_policies[0]?.id || "");
    setReturnPolicyId(next.defaults?.return_policy_id || next.return_policies[0]?.id || "");
    setMerchantLocationKey(next.defaults?.merchant_location_key || next.locations[0]?.key || "");
  }, []);

  // Check whether this workspace has an active eBay connection.
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

  // Stop OAuth completion polling after connect/reconnect attempts finish.
  const clearStatusPoll = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Load eBay business policies plus inventory locations for default selection.
  const loadPolicies = useCallback(async (): Promise<EbayPoliciesResponse | null> => {
    setPoliciesLoading(true);
    setPolicyError(null);
    try {
      const res = await fetchAuth(ebayPoliciesPath(MARKETPLACE_ID));
      const next = await readJsonOrError<EbayPoliciesResponse>(res);
      setPolicies(next);
      applyDefaults(next);
      return next;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load eBay policies";
      setPolicyError(msg);
      showToast(msg);
      return null;
    } finally {
      setPoliciesLoading(false);
    }
  }, [applyDefaults, fetchAuth, showToast]);

  // Poll briefly after redirect starts so returning from eBay updates the UI.
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

  // Refresh connection status on first render and when user returns to this tab.
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

  // Fetch setup only while connected; clear stale setup when disconnected.
  useEffect(() => {
    if (status === "connected") void loadPolicies();
    if (status === "disconnected") {
      setPolicies(null);
      setPolicyError(null);
    }
  }, [loadPolicies, status]);

  // Clean up any active polling timer when the card unmounts.
  useEffect(() => clearStatusPoll, [clearStatusPoll]);

  // Start eBay OAuth, using reconnect mode to reset stale saved setup.
  const onConnect = useCallback(async () => {
    setConnectLoading(true);
    const reconnect = status === "connected";
    let redirecting = false;
    if (reconnect) {
      setPolicies(null);
      setPolicyError(null);
      setFulfillmentPolicyId("");
      setPaymentPolicyId("");
      setReturnPolicyId("");
      setMerchantLocationKey("");
      setLocationForm(INITIAL_EBAY_LOCATION_FORM);
      setStatus("loading");
    }
    try {
      const res = await fetchAuth(ebayOAuthStartPath({ reconnect }));
      const payload = await res.json().catch(() => undefined);

      if (res.ok && payload && typeof payload === "object" && "url" in payload) {
        const url =
          typeof (payload as { url?: unknown }).url === "string"
            ? (payload as { url: string }).url.trim()
            : "";

        if (url) {
          redirecting = true;
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
      if (reconnect && !redirecting) void refreshStatus({ quiet: true });
      setConnectLoading(false);
    }
  }, [fetchAuth, refreshStatus, showToast, startStatusPoll, status]);

  const onLocationFieldChange = useCallback(
    (field: keyof CreateEbayLocationRequest, value: string) => {
      setLocationForm((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const appendCreatedLocation = useCallback((created: EbayLocationOption) => {
    setPolicies((current) => {
      if (!current) return current;
      const hasLocation = current.locations.some((location) => location.key === created.key);
      const locations = hasLocation ? current.locations : [...current.locations, created];
      return {
        ...current,
        locations,
        missing: current.missing.filter((item) => item !== "inventory location"),
        counts: current.counts ? { ...current.counts, locations: locations.length } : current.counts,
      };
    });
  }, []);

  const onCreateLocation = useCallback(async () => {
    const body: CreateEbayLocationRequest = {
      name: locationForm.name.trim(),
      address_line1: locationForm.address_line1.trim(),
      city: locationForm.city.trim(),
      state_or_province: locationForm.state_or_province.trim(),
      postal_code: locationForm.postal_code.trim(),
      country: (locationForm.country.trim() || "US").toUpperCase(),
    };

    setLocationSaving(true);
    setPolicyError(null);
    try {
      const res = await fetchAuth(ebayLocationsPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const created = await readJsonOrError<EbayLocationOption>(res);
      appendCreatedLocation(created);
      setMerchantLocationKey(created.key);
      const refreshed = await loadPolicies();
      if (refreshed?.locations.some((location) => location.key === created.key)) {
        setMerchantLocationKey(created.key);
      } else {
        appendCreatedLocation(created);
      }
      showToast("eBay ship-from location created.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create eBay ship-from location";
      setPolicyError(msg);
      showToast(msg);
    } finally {
      setLocationSaving(false);
    }
  }, [appendCreatedLocation, fetchAuth, loadPolicies, locationForm, showToast]);

  // Persist selected policies and ship-from inventory location for future drafts.
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
  const policySetupHint = policies ? ebayPolicySetupHint(policies) : null;
  const missingInventoryLocation = policies?.missing.includes("inventory location") ?? false;
  const shouldShowLocationForm =
    connected && (missingInventoryLocation || !policies?.locations.length);
  const canCreateLocation =
    connected &&
    !locationSaving &&
    Boolean(
      locationForm.name.trim() &&
        locationForm.address_line1.trim() &&
        locationForm.city.trim() &&
        locationForm.state_or_province.trim() &&
        locationForm.postal_code.trim() &&
        locationForm.country.trim()
    );
  const canSavePolicies =
    connected &&
    !policiesSaving &&
    Boolean(fulfillmentPolicyId && paymentPolicyId && returnPolicyId && merchantLocationKey);
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
            orangeBubbleClassName,
            "landing-sans-copy inline-flex w-full items-center justify-center px-6 py-3 text-center text-[13px] font-semibold no-underline disabled:pointer-events-none sm:w-auto",
          ].join(" ")}
          style={orangeBubbleStyle}
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
              <h3 className="text-sm font-semibold text-zinc-950">Listing defaults</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
                Choose the eBay business policies and separate ship-from location Clawpify
                should use when creating listing drafts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadPolicies()}
              disabled={policiesLoading}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {policiesLoading ? "Refreshing..." : "Refresh setup"}
            </button>
          </div>

          <EbayListingDefaultsGuide />

          {policySetupHint ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {policySetupHint.message}
              {policySetupHint.showBusinessPoliciesLink ? (
                <>
                  {" "}
                  <a
                    href={EBAY_BUSINESS_POLICIES_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline decoration-amber-500 underline-offset-2"
                  >
                    Open eBay business policies
                  </a>
                  .
                </>
              ) : null}
            </p>
          ) : null}
          {policyError ? (
            <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {policyError}
            </p>
          ) : null}

          <div className="mt-4 grid gap-4">
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
              <div>
                <h4 className="text-sm font-semibold text-zinc-950">Business policies</h4>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  eBay policies for buyer-facing shipping, payment, and returns.
                </p>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
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
                        {policy.supports_shipping === false
                          ? `${policy.name} (local pickup only)`
                          : policy.name}
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
              </div>
            </div>

            <div className="rounded-lg border border-zinc-100 bg-white p-3">
              <div>
                <h4 className="text-sm font-semibold text-zinc-950">Ship-from location</h4>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Not a business policy. This is the address eBay uses as the offer
                  ship-from location.
                </p>
              </div>
              <label className="mt-3 grid gap-1.5 text-sm md:max-w-xl">
                <span className="font-medium text-zinc-700">Inventory location</span>
                <select
                  value={merchantLocationKey}
                  onChange={(e) => setMerchantLocationKey(e.target.value)}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
                >
                  <option value="">
                    {policies?.locations.length
                      ? "Select inventory location"
                      : "Create an eBay inventory location, then refresh"}
                  </option>
                  {policies?.locations.map((location) => (
                    <option key={location.key} value={location.key}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs leading-5 text-zinc-500">
                  Use a location like Warehouse, Store, or Home office.
                </span>
              </label>
              {shouldShowLocationForm ? (
                <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
                  <div>
                    <h5 className="text-sm font-semibold text-zinc-950">
                      Create ship-from location
                    </h5>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Create a Clawpify ship-from location for this eBay account.
                    </p>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium text-zinc-700">Location name</span>
                      <input
                        value={locationForm.name}
                        onChange={(e) => onLocationFieldChange("name", e.target.value)}
                        placeholder="Clawpify Ship From"
                        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium text-zinc-700">Street address</span>
                      <input
                        value={locationForm.address_line1}
                        onChange={(e) => onLocationFieldChange("address_line1", e.target.value)}
                        placeholder="123 Main St"
                        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium text-zinc-700">City</span>
                      <input
                        value={locationForm.city}
                        onChange={(e) => onLocationFieldChange("city", e.target.value)}
                        placeholder="Austin"
                        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_0.8fr] md:col-span-2">
                      <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-zinc-700">State</span>
                        <input
                          value={locationForm.state_or_province}
                          onChange={(e) =>
                            onLocationFieldChange("state_or_province", e.target.value)
                          }
                          placeholder="TX"
                          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-zinc-700">ZIP</span>
                        <input
                          value={locationForm.postal_code}
                          onChange={(e) => onLocationFieldChange("postal_code", e.target.value)}
                          placeholder="78701"
                          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-zinc-700">Country</span>
                        <input
                          value={locationForm.country}
                          onChange={(e) => onLocationFieldChange("country", e.target.value)}
                          placeholder="US"
                          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={!canCreateLocation}
                      onClick={() => void onCreateLocation()}
                      className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {locationSaving ? "Creating..." : "Create ship-from location"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
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