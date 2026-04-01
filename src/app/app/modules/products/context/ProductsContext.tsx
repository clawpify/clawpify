import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthenticatedFetch } from "../../../../../lib/api";
import type { ConsignmentListingDto, CreateListingBody, ProductsContextValue } from "../types";
import {
  ensureListingMutationOk,
  listingsCreatePath,
  listingsDetailPath,
  listingsListPath,
  parseListingResponse,
  parseListingsResponse,
  uploadListingObject,
} from "../utils/listingsApi";

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const fetchAuth = useAuthenticatedFetch();
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

  const createListingWithImageFiles = useCallback(
    async (body: CreateListingBody, imageFiles: File[]) => {
      setCreating(true);
      setCreateError(null);
      try {
        const payload = { ...body, media_urls: [] as unknown[] };
        const res = await fetchAuth(listingsCreatePath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await parseListingResponse(res);
        for (const file of imageFiles) {
          await uploadListingObject(fetchAuth, created.id, file);
        }
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

  const value = useMemo(
    () => ({
      listings,
      loading,
      error,
      refetch: () => refetch(),
      createListing,
      createListingWithImageFiles,
      creating,
      createError,
      deleteListing,
      deleting,
    }),
    [
      listings,
      loading,
      error,
      refetch,
      createListing,
      createListingWithImageFiles,
      creating,
      createError,
      deleteListing,
      deleting,
    ]
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
