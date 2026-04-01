import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useWorkspaceHeader } from "../../../context/WorkspaceHeaderContext";
import { copy } from "../../../utils/copy";
import { useProducts } from "../context/ProductsContext";
import type { ProductStatusTab } from "../types";
import { useIsLgUp } from "../utils/useIsLgUp";
import { filterProductListings } from "../utils/productStatusTab";
import { ProductsCreateModal } from "./ProductsCreateModal";
import { ProductsEmptyState } from "./ProductsEmptyState";
import { ProductsInventoryTable } from "./ProductsInventoryTable";
import { ProductsInventoryToolbar } from "./ProductsInventoryToolbar";
import { ProductsListingDetail } from "./ProductsListingDetail";
import { ClawpifyLoadingScreen } from "../../../components/ClawpifyLoadingScreen";
import { usePrefetchAuthImageUrls } from "@/lib/authenticatedMedia";
import { listingPrimaryImageUrl } from "../utils/listingMedia";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export function ProductsPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const isLgUp = useIsLgUp();
  const { setConfig } = useWorkspaceHeader();
  const { listings, loading, error, refetch, creating, createError, deleteListing, deleting } = useProducts();

  const [statusTab, setStatusTab] = useState<ProductStatusTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const displayed = useMemo(
    () => filterProductListings(listings, statusTab, searchQuery),
    [listings, statusTab, searchQuery]
  );

  const tableThumbPrefetchUrls = useMemo(() => {
    if (loading) return [];
    return displayed
      .slice(0, 48)
      .map((l) => listingPrimaryImageUrl(l))
      .filter((u): u is string => Boolean(u));
  }, [loading, displayed]);

  usePrefetchAuthImageUrls(tableThumbPrefetchUrls);

  const selectedListing = useMemo(
    () => (listingId ? listings.find((l) => l.id === listingId) : undefined),
    [listings, listingId]
  );

  const onSelect = useCallback(
    (id: string) => {
      navigate(`/app/products/${id}`);
    },
    [navigate]
  );

  const onDelete = useCallback(
    async (id: string) => {
      setDeleteError(null);
      try {
        await deleteListing(id);
        if (listingId === id) navigate("/app/products", { replace: true });
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : "Unknown error");
      }
    },
    [deleteListing, listingId, navigate]
  );

  useEffect(() => {
    setConfig({ hideHeader: true });
    return () => setConfig({});
  }, [setConfig]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      if (key !== "c" && key !== "C") return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      if (!creating && !createModalOpen) setCreateModalOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [creating, createModalOpen]);

  const toolbar = (
    <ProductsInventoryToolbar
      statusTab={statusTab}
      onStatusTab={setStatusTab}
      searchQuery={searchQuery}
      onSearchQuery={setSearchQuery}
      onOpenCreate={() => setCreateModalOpen(true)}
      creating={creating}
    />
  );

  const alerts = (
    <>
      {createError ? (
        <div className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-800" role="alert">
          {copy.products.createFailedPrefix} {createError}
        </div>
      ) : null}
      {deleteError ? (
        <div className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-800" role="alert">
          {copy.products.deleteFailedPrefix} {deleteError}
        </div>
      ) : null}
    </>
  );

  const loadingBody = <ClawpifyLoadingScreen variant="fill" message={copy.products.loading} />;

  const errorBody = (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12">
      <p className="text-sm text-red-600" role="alert">
        {copy.products.loadErrorPrefix} {error}
      </p>
      <button
        type="button"
        onClick={() => void refetch()}
        className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
      >
        {copy.products.retry}
      </button>
    </div>
  );

  if (loading) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        {alerts}
        {loadingBody}
        <ProductsCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={(id) => navigate(`/app/products/${id}`)}
        />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        {alerts}
        {errorBody}
        <ProductsCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={(id) => navigate(`/app/products/${id}`)}
        />
      </main>
    );
  }

  if (listingId) {
    if (!isLgUp) {
      return (
        <main
          className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
          style={{ fontFamily: "var(--workspace-font)" }}
        >
          {alerts}
          <div className="flex min-h-0 flex-1 flex-col px-4 py-8 sm:px-6">
            <button
              type="button"
              onClick={() => navigate("/app/products")}
              className="mb-6 w-fit text-sm font-medium text-zinc-600 underline-offset-4 transition hover:text-zinc-900 hover:underline"
            >
              {copy.products.detailBackToProducts}
            </button>
            <div className="mx-auto max-w-md text-center">
              <h1 className="text-lg font-semibold text-zinc-900">{copy.products.detailDesktopOnlyTitle}</h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{copy.products.detailDesktopOnlyBody}</p>
            </div>
          </div>
          <ProductsCreateModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onCreated={(id) => navigate(`/app/products/${id}`)}
          />
        </main>
      );
    }

    if (!selectedListing) {
      return (
        <main
          className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white"
          style={{ fontFamily: "var(--workspace-font)" }}
        >
          {alerts}
          <div className="flex min-h-0 flex-1 flex-col px-4 py-8 sm:px-6">
            <Link
              to="/app/products"
              className="mb-6 w-fit text-sm font-medium text-zinc-600 underline-offset-4 transition hover:text-zinc-900 hover:underline"
            >
              {copy.products.detailBackToProducts}
            </Link>
            <div className="mx-auto max-w-md text-center">
              <h1 className="text-lg font-semibold text-zinc-900">{copy.products.detailNotFoundTitle}</h1>
              <p className="mt-2 text-sm text-zinc-600">{copy.products.detailNotFoundBody}</p>
              <Link
                to="/app/products"
                className="mt-6 inline-block rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              >
                {copy.products.detailViewProducts}
              </Link>
            </div>
          </div>
          <ProductsCreateModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onCreated={(id) => navigate(`/app/products/${id}`)}
          />
        </main>
      );
    }

    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {alerts}
        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 sm:px-6"
          style={{ fontFamily: "var(--workspace-font)" }}
        >
          <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-zinc-100 py-3">
            <Link
              to="/app/products"
              className="text-sm font-medium text-zinc-500 underline-offset-4 transition hover:text-zinc-900 hover:underline"
            >
              {copy.products.pageHeading}
            </Link>
            <span className="text-zinc-300" aria-hidden>
              /
            </span>
            <span className="min-w-0 truncate text-sm font-medium text-zinc-900">{selectedListing.title}</span>
          </header>
          <div className="min-h-0 flex-1 overflow-auto bg-white pb-16 pt-4 sm:pb-24 sm:pt-5">
            <ProductsListingDetail listing={selectedListing} />
          </div>
        </div>
        <ProductsCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={(id) => navigate(`/app/products/${id}`)}
        />
      </main>
    );
  }

  if (listings.length === 0) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        {alerts}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 sm:px-6">
          {toolbar}
          <ProductsEmptyState />
        </div>
        <ProductsCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={(id) => navigate(`/app/products/${id}`)}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {alerts}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 sm:px-6">
        {toolbar}
        <ProductsInventoryTable listings={displayed} onSelect={onSelect} onDelete={onDelete} deleteDisabled={deleting} />
      </div>
      <ProductsCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(id) => navigate(`/app/products/${id}`)}
      />
    </main>
  );
}
