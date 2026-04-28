import { useCallback, useEffect, useState } from "react";
import { useAuthenticatedFetch } from "../../../../lib/api";
import { messageFromErrorBody } from "../../../../lib/messageFromErrorBody";
import { useToast } from "../../../../lib/toast";
import { SettingsIcon } from "../../../../icons/workspace-icons";
import { useWorkspaceHeader } from "../../context/WorkspaceHeaderContext";
import { copy } from "../../utils/copy";
import {
  landingOrangeBubbleClassName,
  landingOrangeBubbleStyle,
} from "../../../landing/components/Button";

type EbayStatus = "loading" | "connected" | "disconnected";

export function SettingsPage() {
  const { setConfig } = useWorkspaceHeader();

  useEffect(() => {
    setConfig({
      context: copy.settings.title,
      contextIcon: (
        <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-200 text-zinc-700">
          <SettingsIcon size={14} className="text-current" />
        </span>
      ),
    });

    return () => setConfig({});
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

  const refreshStatus = useCallback(async () => {
    setStatus("loading");
    const res = await fetchAuth("/api/v1/oauth/ebay/status");
    if (res.ok) {
      const data = (await res.json().catch(() => null)) as { connected?: boolean } | null;
      setStatus(data?.connected ? "connected" : "disconnected");
      return;
    }
    setStatus("disconnected");
  }, [fetchAuth]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const onConnect = useCallback(async () => {
    setConnectLoading(true);
    try {
      const res = await fetchAuth("/api/v1/oauth/ebay/start");
      const payload = await res.json().catch(() => undefined);

      if (res.ok && payload && typeof payload === "object" && "url" in payload) {
        const url =
          typeof (payload as { url?: unknown }).url === "string"
            ? (payload as { url: string }).url.trim()
            : "";

        if (url) {
          window.open(url, "_blank", "noopener=yes,noreferrer=yes");
          return;
        }
      }

      if (res.status === 401) {
        showToast(copy.settings.ebayConnectSignIn);
        return;
      }

      const msg = messageFromErrorBody(payload) ?? `Could not start eBay link (${res.status})`;
      showToast(msg);
    } finally {
      setConnectLoading(false);
    }
  }, [fetchAuth, showToast]);

  const connected = status === "connected";
  const statusText =
    status === "loading"
      ? copy.settings.integrationStatusChecking
      : connected
        ? copy.settings.integrationStatusConnected
        : copy.settings.integrationStatusDisconnected;

  return (
    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
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
  );
}
