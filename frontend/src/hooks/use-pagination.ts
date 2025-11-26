import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, fetchWithAuth } from "@/lib/auth";

interface UsePaginationOptions<T> {
  url: string;
  perPage?: number;
  parseResponse?: (data: any) => T[];
  onError?: (error: Error) => void;
  requiresAuth?: boolean;
}

/**
 * Hook reutilizável para paginação com scroll infinito
 * Usado em songs/Index e setlists/Index
 */
export function usePagination<T>({
  url,
  perPage = 6,
  parseResponse,
  onError,
  requiresAuth = true,
}: UsePaginationOptions<T>) {
  const navigate = useNavigate();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Default JSONAPI parser
  const defaultParser = useCallback((jsonData: any): T[] => {
    if (jsonData.data && Array.isArray(jsonData.data)) {
      return jsonData.data.map((item: any) => ({
        id: item.id,
        ...item.attributes,
      }));
    }
    return Array.isArray(jsonData) ? jsonData : [];
  }, []);

  const parser = parseResponse || defaultParser;

  // Fetch data
  useEffect(() => {
    // Check authentication
    if (requiresAuth && !isAuthenticated()) {
      navigate("/auth/login");
      return;
    }

    let mounted = true;

    const fetchData = async (pageToLoad: number) => {
      const fetchUrl = `${url}?page=${pageToLoad}&per_page=${perPage}`;

      try {
        if (pageToLoad === 1) setLoading(true);
        else setLoadingMore(true);

        const res = await fetchWithAuth(fetchUrl);

        if (!res.ok) {
          if (res.status === 401) {
            navigate("/auth/login");
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const jsonData = await res.json();
        const data = parser(jsonData);

        if (!mounted) return;

        if (pageToLoad === 1) {
          setItems(data || []);
        } else {
          setItems((prev) => [...prev, ...(data || [])]);
        }

        // Check if there are more pages
        if (!data || data.length < perPage) {
          setHasMore(false);
        }
      } catch (err: any) {
        console.error("Pagination fetch error:", err);
        if (mounted) {
          const errorMsg = err.message || "Erro ao carregar dados";
          setError(errorMsg);
          onError?.(err);
          setHasMore(false);
        }
      } finally {
        if (!mounted) return;
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchData(page);

    return () => {
      mounted = false;
    };
  }, [page, url, perPage, parser, navigate, onError, requiresAuth]);

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      setPage((p) => p + 1);
    }
  }, [hasMore, loadingMore]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    page,
    sentinelRef,
    refresh,
    loadMore,
    setItems,
  };
}
