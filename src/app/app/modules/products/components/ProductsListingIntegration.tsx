import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useAuthenticatedFetch } from "../../../../../lib/api";
import { messageFromErrorBody } from "../../../../../lib/messageFromErrorBody";
import { useToast } from "../../../../../lib/toast";
import { copy } from "../../../utils/copy";
import type {
  ConsignmentListingDto,
  EbayDraftRequest,
  EbayDraftResponse,
  EbayOAuthStartResponse,
  EbayOAuthStatusResponse,
  EbayPublishResponse,
  EbaySellerSetupResponse,
} from "../types";
import {
  ebayOAuthStartPath,
  ebayOAuthStatusPath,
  ebaySellerSetupPath,
  listingEbayDraftPath,
  listingEbayPublishPath,
} from "@/utils/networkFns";

type EbayConnectionStatus = "loading" | "connected" | "disconnected";
type EbayBusyState = "idle" | "connecting" | "drafting" | "publishing";

const MARKETPLACE_ID = "EBAY_US";
const DEFAULT_CATEGORY_ID = "57988";
const DEFAULT_CONDITION_ID = "USED_EXCELLENT";

type SellerDefaults = {
  fulfillmentPolicyId: string;
  paymentPolicyId: string;
  returnPolicyId: string;
  merchantLocationKey?: string;
};

type Requirement = {
  label: string;
  ok: boolean;
};

type ChannelRowProps = {
  name: string;
  status: string;
  actionLabel: string;
  onOpen?: () => void;
  onAction?: () => void;
  disabled?: boolean;
  muted?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function collectRecords(value: unknown, out: Record<string, unknown>[] = [], depth = 0) {
  if (depth > 5) return out;
  if (Array.isArray(value)) {
    for (const item of value) collectRecords(item, out, depth + 1);
    return out;
  }
  if (!isRecord(value)) return out;
  out.push(value);
  for (const next of Object.values(value)) collectRecords(next, out, depth + 1);
  return out;
}

function firstStringField(value: unknown, keys: string[]): string {
  for (const obj of collectRecords(value)) {
    for (const key of keys) {
      const raw = obj[key];
      if (typeof raw === "string" && raw.trim()) return raw.trim();
    }
  }
  return "";
}

function parseSellerDefaults(setup: EbaySellerSetupResponse): SellerDefaults {
  return {
    fulfillmentPolicyId: firstStringField(setup.fulfillment_policies, [
      "fulfillmentPolicyId",
      "fulfillment_policy_id",
      "id",
    ]),
    paymentPolicyId: firstStringField(setup.payment_policies, [
      "paymentPolicyId",
      "payment_policy_id",
      "id",
    ]),
    returnPolicyId: firstStringField(setup.return_policies, [
      "returnPolicyId",
      "return_policy_id",
      "id",
    ]),
    merchantLocationKey:
      firstStringField(setup.locations, [
        "merchantLocationKey",
        "merchant_location_key",
        "locationKey",
        "location_key",
        "name",
      ]) || undefined,
  };
}

function ebayListingUrl(listingId: string | null): string | null {
  const id = listingId?.trim();
  if (!id) return null;
  return `https://www.ebay.com/itm/${encodeURIComponent(id)}`;
}

async function readJsonOrError<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new Error(messageFromErrorBody(body) ?? `Request failed: ${res.status}`);
  }
  return body as T;
}

function RequirementRow({ label, ok }: Requirement) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-600">
      <span className={`size-2 shrink-0 rounded-full ${ok ? "bg-emerald-500" : "bg-zinc-300"}`} aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </div>
  );
}

function ChannelRow({
  name,
  status,
  actionLabel,
  onOpen,
  onAction,
  disabled,
  muted,
}: ChannelRowProps) {
  const onActionClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onAction?.();
    },
    [onAction]
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={muted && !onOpen}
      className="flex w-full items-center justify-between gap-2 border-t border-zinc-100 px-2 py-2 text-left transition first:border-t-0 hover:bg-zinc-50 disabled:cursor-default disabled:hover:bg-transparent"
    >
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium text-zinc-700">{name}</span>
        <span className="mt-0.5 block truncate text-[11px] text-zinc-400">{status}</span>
      </span>
      <span className="shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={onActionClick}
          className={[
            "rounded-md border px-2 py-1 text-[11px] font-medium transition",
            muted
              ? "border-zinc-200 bg-zinc-50 text-zinc-400"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
            disabled ? "cursor-not-allowed opacity-55" : "",
          ].join(" ")}
        >
          {actionLabel}
        </button>
      </span>
    </button>
  );
}

function IntegrationDetailsModal({
  listing,
  requirements,
  categoryId,
  conditionId,
  localPickup,
  onCategoryChange,
  onConditionChange,
  onLocalPickupChange,
  onClose,
  onCreateDraft,
  onPublish,
  draft,
  published,
  canCreateDraft,
  busy,
  error,
}: {
  listing: ConsignmentListingDto;
  requirements: Requirement[];
  categoryId: string;
  conditionId: string;
  localPickup: boolean;
  onCategoryChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onConditionChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onLocalPickupChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onCreateDraft: () => void;
  onPublish: () => void;
  draft: EbayDraftResponse | null;
  published: EbayPublishResponse | null;
  canCreateDraft: boolean;
  busy: EbayBusyState;
  error: string | null;
}) {
  const publishedUrl = ebayListingUrl(published?.listing_id ?? null);
  const draftReady = Boolean(draft && !published);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[360] flex items-center justify-center bg-zinc-950/20 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ebay-integration-modal-title"
        className="flex max-h-[min(38rem,90vh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id="ebay-integration-modal-title" className="text-base font-semibold text-zinc-950">
              {copy.products.detailIntegrationModalTitle}
            </h2>
            <p className="mt-0.5 truncate text-sm text-zinc-500">{listing.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xl leading-none text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label={copy.products.detailIntegrationModalClose}
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">{copy.products.detailIntegrationDefaults}</h3>
              <p className="mt-1 max-w-md text-sm leading-5 text-zinc-500">
                {copy.products.detailIntegrationModalBody}
              </p>
            </div>
            {draft ? (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                {copy.products.detailIntegrationOfferId}: {draft.offer_id}
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-700">{copy.products.detailIntegrationMarketplace}</span>
              <input
                value={MARKETPLACE_ID}
                readOnly
                className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-700">{copy.products.detailIntegrationCategoryId}</span>
              <input
                value={categoryId}
                onChange={onCategoryChange}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-700">{copy.products.detailIntegrationConditionId}</span>
              <input
                value={conditionId}
                onChange={onConditionChange}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-400"
              />
            </label>
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm">
            <input
              type="checkbox"
              checked={localPickup}
              onChange={onLocalPickupChange}
              className="mt-0.5 size-4 rounded border-zinc-300 text-zinc-950"
            />
            <span className="min-w-0">
              <span className="block font-medium text-zinc-700">{copy.products.detailIntegrationLocalPickup}</span>
              <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
                {copy.products.detailIntegrationLocalPickupHint}
              </span>
            </span>
          </label>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-zinc-950">{copy.products.detailIntegrationRequirements}</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {requirements.map((req) => (
                <RequirementRow key={req.label} {...req} />
              ))}
            </div>
          </div>

          {published?.listing_id ? (
            <p className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {copy.products.detailIntegrationListingId}: {published.listing_id}
            </p>
          ) : null}
          {error ? (
            <p className="mt-5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {copy.products.detailIntegrationErrorPrefix} {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50/70 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            {copy.products.detailDescriptionCancel}
          </button>
          {publishedUrl ? (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              {copy.products.detailIntegrationViewEbay}
            </a>
          ) : draftReady ? (
            <button
              type="button"
              disabled={busy !== "idle"}
              onClick={onPublish}
              className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "publishing" ? copy.products.detailIntegrationPublishing : copy.products.detailIntegrationPublish}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canCreateDraft}
              onClick={onCreateDraft}
              className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "drafting" ? copy.products.detailIntegrationDrafting : copy.products.detailIntegrationDraft}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ProductsListingIntegration({ listing }: { listing: ConsignmentListingDto }) {
  const fetchAuth = useAuthenticatedFetch();
  const { showToast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<EbayConnectionStatus>("loading");
  const [busy, setBusy] = useState<EbayBusyState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EbayDraftResponse | null>(null);
  const [published, setPublished] = useState<EbayPublishResponse | null>(null);
  const [categoryId, setCategoryId] = useState(DEFAULT_CATEGORY_ID);
  const [conditionId, setConditionId] = useState(DEFAULT_CONDITION_ID);
  const [localPickup, setLocalPickup] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const connected = connectionStatus === "connected";
  const titleOk = listing.title.trim().length > 0;
  const skuOk = listing.sku.trim().length > 0;
  const priceOk = listing.price_cents > 0;
  const categoryOk = categoryId.trim().length > 0;
  const conditionOk = conditionId.trim().length > 0;
  const draftReady = Boolean(draft && !published);
  const publishedUrl = ebayListingUrl(published?.listing_id ?? null);

  const requirements = useMemo<Requirement[]>(
    () => [
      { label: copy.products.detailIntegrationReqConnected, ok: connected },
      { label: copy.products.detailIntegrationReqSku, ok: skuOk },
      { label: copy.products.detailIntegrationReqTitle, ok: titleOk },
      { label: copy.products.detailIntegrationReqPrice, ok: priceOk },
      { label: copy.products.detailIntegrationReqCategory, ok: categoryOk },
      { label: copy.products.detailIntegrationReqCondition, ok: conditionOk },
    ],
    [categoryOk, conditionOk, connected, priceOk, skuOk, titleOk]
  );

  const canCreateDraft =
    connected && skuOk && titleOk && priceOk && categoryOk && conditionOk && busy === "idle";

  const refreshConnectionStatus = useCallback(async () => {
    setConnectionStatus("loading");
    const res = await fetchAuth(ebayOAuthStatusPath);
    if (!res.ok) {
      setConnectionStatus("disconnected");
      return;
    }
    const data = await readJsonOrError<EbayOAuthStatusResponse>(res);
    setConnectionStatus(data.connected ? "connected" : "disconnected");
  }, [fetchAuth]);

  useEffect(() => {
    void refreshConnectionStatus().catch(() => setConnectionStatus("disconnected"));
  }, [refreshConnectionStatus]);

  const startConnect = useCallback(async () => {
    setBusy("connecting");
    setError(null);
    try {
      const res = await fetchAuth(ebayOAuthStartPath);
      const payload = await readJsonOrError<EbayOAuthStartResponse>(res);
      const url = payload.url.trim();
      if (!url) throw new Error("eBay authorize URL was empty");
      window.location.assign(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      setDetailsOpen(true);
      showToast(`${copy.products.detailIntegrationErrorPrefix} ${msg}`);
    } finally {
      setBusy("idle");
    }
  }, [fetchAuth, showToast]);

  const createDraft = useCallback(async () => {
    if (!canCreateDraft) {
      setDetailsOpen(true);
      return;
    }
    setBusy("drafting");
    setError(null);
    try {
      const setupRes = await fetchAuth(ebaySellerSetupPath(MARKETPLACE_ID, localPickup));
      const setup = await readJsonOrError<EbaySellerSetupResponse>(setupRes);
      const defaults = parseSellerDefaults(setup);
      if (!defaults.fulfillmentPolicyId || !defaults.paymentPolicyId || !defaults.returnPolicyId) {
        throw new Error("Missing eBay seller policies. Create fulfillment, payment, and return policies in eBay first.");
      }

      const body: EbayDraftRequest = {
        marketplace_id: MARKETPLACE_ID,
        category_id: categoryId.trim(),
        condition_id: conditionId.trim(),
        fulfillment_policy_id: defaults.fulfillmentPolicyId,
        payment_policy_id: defaults.paymentPolicyId,
        return_policy_id: defaults.returnPolicyId,
        quantity: 1,
        aspects: {},
      };
      if (defaults.merchantLocationKey) body.merchant_location_key = defaults.merchantLocationKey;

      const draftRes = await fetchAuth(listingEbayDraftPath(listing.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const created = await readJsonOrError<EbayDraftResponse>(draftRes);
      setDraft(created);
      setPublished(null);
      showToast(copy.products.detailIntegrationDraftCreated);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      setDetailsOpen(true);
      showToast(`${copy.products.detailIntegrationErrorPrefix} ${msg}`);
    } finally {
      setBusy("idle");
    }
  }, [canCreateDraft, categoryId, conditionId, fetchAuth, listing.id, localPickup, showToast]);

  const publishDraft = useCallback(async () => {
    if (!draft || busy !== "idle") return;
    setBusy("publishing");
    setError(null);
    try {
      const res = await fetchAuth(listingEbayPublishPath(listing.id), { method: "POST" });
      const out = await readJsonOrError<EbayPublishResponse>(res);
      setPublished(out);
      showToast(copy.products.detailIntegrationPublishedToast);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      setDetailsOpen(true);
      showToast(`${copy.products.detailIntegrationErrorPrefix} ${msg}`);
    } finally {
      setBusy("idle");
    }
  }, [busy, draft, fetchAuth, listing.id, showToast]);

  const openPublishedUrl = useCallback(() => {
    if (publishedUrl) window.open(publishedUrl, "_blank", "noopener=yes,noreferrer=yes");
  }, [publishedUrl]);

  const onEbayAction = useCallback(() => {
    if (publishedUrl) {
      openPublishedUrl();
      return;
    }
    if (draftReady) {
      void publishDraft();
      return;
    }
    if (!connected) {
      void startConnect();
      return;
    }
    if (canCreateDraft) {
      void createDraft();
      return;
    }
    setDetailsOpen(true);
  }, [canCreateDraft, connected, createDraft, draftReady, openPublishedUrl, publishDraft, publishedUrl, startConnect]);

  const onCategoryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCategoryId(e.target.value);
  }, []);

  const onConditionChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setConditionId(e.target.value);
  }, []);

  const onLocalPickupChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLocalPickup(e.target.checked);
  }, []);

  const statusText = published
    ? copy.products.detailIntegrationPublished
    : draft
      ? copy.products.detailIntegrationDraftReady
      : connected
        ? canCreateDraft
          ? copy.products.detailIntegrationReady
          : copy.products.detailIntegrationNeedsDetails
        : connectionStatus === "loading"
          ? copy.settings.integrationStatusChecking
          : copy.settings.integrationStatusDisconnected;

  const actionLabel = published
    ? copy.products.detailIntegrationView
    : draftReady
      ? copy.products.detailIntegrationPublish
      : !connected
        ? copy.products.detailIntegrationConnectShort
        : canCreateDraft
          ? copy.products.detailIntegrationDraftShort
          : copy.products.detailIntegrationDetails;

  return (
    <div className="px-2 pb-2 pt-1">
      <p className="px-0.5 py-1 text-[11px] leading-4 text-zinc-400">
        {copy.products.detailIntegrationChannelsHint}
      </p>

      <div className="overflow-hidden rounded-md border border-zinc-100 bg-zinc-50/60">
        <ChannelRow
          name="eBay"
          status={statusText}
          actionLabel={busy === "connecting" ? copy.settings.integrationStatusChecking : actionLabel}
          onOpen={() => setDetailsOpen(true)}
          onAction={onEbayAction}
          disabled={busy !== "idle" || connectionStatus === "loading"}
        />
        <ChannelRow
          name={copy.products.detailIntegrationShopify}
          status={copy.products.detailIntegrationComingSoon}
          actionLabel={copy.products.detailIntegrationSoon}
          disabled
          muted
        />
        <ChannelRow
          name={copy.products.detailIntegrationEtsy}
          status={copy.products.detailIntegrationComingSoon}
          actionLabel={copy.products.detailIntegrationSoon}
          disabled
          muted
        />
      </div>

      {detailsOpen ? (
        <IntegrationDetailsModal
          listing={listing}
          requirements={requirements}
          categoryId={categoryId}
          conditionId={conditionId}
          localPickup={localPickup}
          onCategoryChange={onCategoryChange}
          onConditionChange={onConditionChange}
          onLocalPickupChange={onLocalPickupChange}
          onClose={() => setDetailsOpen(false)}
          onCreateDraft={createDraft}
          onPublish={publishDraft}
          draft={draft}
          published={published}
          canCreateDraft={canCreateDraft}
          busy={busy}
          error={error}
        />
      ) : null}
    </div>
  );
}