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
import type { ConsignmentListingDto } from "../types";
import { listingsListPath, parseListingsResponse } from "../utils/listingsApi";

type ProductsContextValue = {
  listings: ConsignmentListingDto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const fetchAuth = useAuthenticatedFetch();
  const [listings, setListings] = useState<ConsignmentListingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuth(listingsListPath({ limit: 100, offset: 0 }));
      setListings(await parseListingsResponse(res));
    } catch (e) {
      setListings([]);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fetchAuth]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const value = useMemo(
    () => ({ listings, loading, error, refetch }),
    [listings, loading, error, refetch]
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
