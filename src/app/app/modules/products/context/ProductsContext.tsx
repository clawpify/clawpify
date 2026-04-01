import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { useAuth, useOrganization } from "@clerk/react";
import { useAuthenticatedFetch } from "../../../../../lib/api";
import type { ConsignmentListingDto, CreateListingBody, ProductsContextValue } from "../types";
import {
  ensureListingMutationOk,
  listingsCreatePath,
  listingsDetailPath,
  listingsListPath,
  parseListingResponse,
  parseListingsResponse,
} from "../utils/listingsApi";

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const fetchAuth = useAuthenticatedFetch();
  const { orgId: authOrgId } = useAuth();
  const { organization } = useOrganization();
  const [listings, setListings] = useState<ConsignmentListingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refetch = useCallback(
    async (opts?: { quiet?: boolean }) => {
      const quiet = opts?.quiet === true;
      if (!quiet) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await fetchAuth(listingsListPath({ limit: 100, offset: 0 }));
        setListings(await parseListingsResponse(res));
        if (!quiet) setError(null);
      } catch (e) {
        setListings([]);
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [fetchAuth]
  );

  const createListing = useCallback(
    async (body: CreateListingBody = {}) => {
      setCreating(true);
      setCreateError(null);
      try {
        const res = await fetchAuth(listingsCreatePath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const created = await parseListingResponse(res);
        await refetch({ quiet: true });
        return created;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setCreateError(msg);
        throw e;
      } finally {
        setCreating(false);
      }
    },
    [fetchAuth, refetch]
  );

  const deleteListing = useCallback(
    async (id: string) => {
      setDeleting(true);
      try {
        const res = await fetchAuth(listingsDetailPath(id), { method: "DELETE" });
        await ensureListingMutationOk(res);
        await refetch({ quiet: true });
      } finally {
        setDeleting(false);
      }
    },
    [fetchAuth, refetch]
  );

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const toImages = useCallback((files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    return list.map((file) => ({
      imageId: `image-${Date.now()}-${imageIdRef.current++}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
  }, []);

  const createDraft = useCallback(() => {
    const clientId = `draft-${Date.now()}-${idRef.current++}`;
    setDrafts((prev) => [
      ...prev,
      {
        clientId,
        images: [],
        model: "",
        originalPrice: "",
        isUsed: true,
        notes: "",
      },
    ]);
    return clientId;
  }, []);

  const addFilesToDraft = useCallback(
    (clientId: string, files: FileList | File[]) => {
      const images = toImages(files);
      if (images.length === 0) return;
      setDrafts((prev) =>
        prev.map((draft) =>
          draft.clientId === clientId ? { ...draft, images: [...draft.images, ...images] } : draft
        )
      );
    },
    [toImages]
  );

  const updateDraft = useCallback(
    (
      clientId: string,
      patch: Partial<Omit<ProductIntakeDraft, "clientId" | "file" | "previewUrl">>
    ) => {
      setDrafts((prev) =>
        prev.map((draft) => (draft.clientId === clientId ? { ...draft, ...patch } : draft))
      );
    },
    []
  );

  const removeDraft = useCallback((clientId: string) => {
    setDrafts((prev) => {
      const target = prev.find((x) => x.clientId === clientId);
      if (target) {
        for (const image of target.images) {
          URL.revokeObjectURL(image.previewUrl);
        }
      }
      return prev.filter((x) => x.clientId !== clientId);
    });
  }, []);

  const removeDraftImage = useCallback((clientId: string, imageId: string) => {
    setDrafts((prev) =>
      prev.map((draft) => {
        if (draft.clientId !== clientId) return draft;
        const target = draft.images.find((image) => image.imageId === imageId);
        if (target) URL.revokeObjectURL(target.previewUrl);
        return {
          ...draft,
          images: draft.images.filter((image) => image.imageId !== imageId),
        };
      })
    );
  }, []);

  const clearDrafts = useCallback(() => {
    setDrafts((prev) => {
      for (const draft of prev) {
        for (const image of draft.images) URL.revokeObjectURL(image.previewUrl);
      }
      return [];
    });
    setProcessResults([]);
    setProcessError(null);
  }, []);

  const clearDraftsAfterProcessing = useCallback(() => {
    setDrafts((prev) => {
      for (const draft of prev) {
        for (const image of draft.images) URL.revokeObjectURL(image.previewUrl);
      }
      return [];
    });
    setProcessError(null);
  }, []);

  const processDrafts = useCallback(
    async () => {
      if (drafts.length === 0) return;

      setProcessing(true);
      setProcessError(null);
      setProcessResults([]);
      try {
        const body = await processProductsRequestBody({ items: drafts });
        const headers = new Headers({ "Content-Type": "application/json" });
        if (effectiveOrgId) headers.set("X-Selected-Org-Id", effectiveOrgId);
        const res = await fetchAuth("/api/products/process", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        const results = await processProductsResponse(res);
        setProcessResults(results);
        await refetch();
        clearDraftsAfterProcessing();
      } catch (e) {
        setProcessError(e instanceof Error ? e.message : "Failed to process products");
      } finally {
        setProcessing(false);
      }
    },
    [clearDraftsAfterProcessing, drafts, effectiveOrgId, fetchAuth, refetch]
  );

  const updateListing = useCallback(
    async (listingId: string, payload: UpdateListingPayload) => {
      const headers = new Headers({ "Content-Type": "application/json" });
      if (effectiveOrgId) headers.set("X-Selected-Org-Id", effectiveOrgId);
      const res = await fetchAuth(listingByIdPath(listingId), {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
      const updated = await parseUpdateListingResponse(res);
      setListings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      return updated;
    },
    [effectiveOrgId, fetchAuth]
  );

  const approveListing = useCallback(
    (listingId: string) =>
      updateListing(listingId, {
        acceptance_status: "accepted",
        decline_reason: null,
      }),
    [updateListing]
  );

  const deleteListing = useCallback(
    async (listingId: string) => {
      const headers = new Headers();
      if (effectiveOrgId) headers.set("X-Selected-Org-Id", effectiveOrgId);
      const res = await fetchAuth(listingByIdPath(listingId), {
        method: "DELETE",
        headers,
      });
      await parseDeleteListingResponse(res);
      setListings((prev) => prev.filter((item) => item.id !== listingId));
    },
    [effectiveOrgId, fetchAuth]
  );

  const value = useMemo(
    () => ({
      listings,
      loading,
      error,
      refetch: () => refetch(),
      createListing,
      creating,
      createError,
      deleteListing,
      deleting,
    }),
    [listings, loading, error, refetch, createListing, creating, createError, deleteListing, deleting]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts(): ProductsContextValue {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error("useProducts must be used within ProductsProvider");
  }
  return ctx;
}
