import { useCallback, useEffect, useRef, useState } from "react";
import {
  orangeBubbleClassName,
  orangeBubbleStyle,
} from "@/components/buttonSurface";
import { SettingsIcon } from "../../../../icons/workspace-icons";
import { useAuthenticatedFetch } from "../../../../lib/api";
import { messageFromErrorBody } from "../../../../lib/messageFromErrorBody";
import { readJsonOrError } from "../../../../lib/readJsonOrError";
import { useToast } from "../../../../lib/toast";
import {
  ebayOAuthStartPath,
  ebayOAuthStatusPath,
  ebayPoliciesPath,
} from "@/utils/networkFns";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { copy } from "../../utils/copy";
import type { EbayPoliciesResponse } from "../products/types";
import type { EbayStatus } from "./types";

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

function ebayReadinessText(setup: EbayPoliciesResponse | null): string {
  if (!setup) return "Checking eBay setup...";
  if (!setup.missing.length) return "Ready to create draft listings.";
  if (setup.missing.includes("inventory location")) {
    return "Need ship-from address. Add it when creating the first eBay draft.";
  }
  return `Missing eBay setup: ${setup.missing.join(", ")}.`;
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
  const [setup, setSetup] = useState<EbayPoliciesResponse | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connected = status === "connected";
  const statusText =
    status === "loading"
      ? copy.settings.integrationStatusChecking
      : connected
        ? copy.settings.integrationStatusConnected
        : copy.settings.integrationStatusDisconnected;

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
    if (!pollTimerRef.current) return;
    clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
  }, []);

  const loadSetup = useCallback(async () => {
    if (!connected) return;
    setSetupLoading(true);
    setSetupError(null);
    try {
      const res = await fetchAuth(ebayPoliciesPath(MARKETPLACE_ID));
      const next = await readJsonOrError<EbayPoliciesResponse>(res);
      setSetup(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not check eBay setup";
      setSetupError(msg);
      showToast(msg);
    } finally {
      setSetupLoading(false);
    }
  }, [connected, fetchAuth, showToast]);

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
    if (connected) void loadSetup();
    if (status === "disconnected") {
      setSetup(null);
      setSetupError(null);
    }
  }, [connected, loadSetup, status]);

  useEffect(() => clearStatusPoll, [clearStatusPoll]);

  const onConnect = useCallback(async () => {
    setConnectLoading(true);
    const reconnect = status === "connected";
    let redirecting = false;
    if (reconnect) {
      setSetup(null);
      setSetupError(null);
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

      showToast(messageFromErrorBody(payload) ?? `Could not start eBay link (${res.status})`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not start eBay link");
    } finally {
      if (reconnect && !redirecting) void refreshStatus({ quiet: true });
      setConnectLoading(false);
    }
  }, [fetchAuth, refreshStatus, showToast, startStatusPoll, status]);

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              {setupLoading ? "Checking eBay setup..." : ebayReadinessText(setup)}
            </p>
            <button
              type="button"
              onClick={() => void loadSetup()}
              disabled={setupLoading}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {setupLoading ? "Checking..." : "Check setup"}
            </button>
          </div>
          {setupError ? (
            <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {setupError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
