import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/lib/auth";

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  redirectOnAuth?: boolean;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook para fazer chamadas à API com tratamento automático de:
 * - Loading states
 * - Error handling
 * - Autenticação (redirect 401)
 * - Parsing JSONAPI format
 * - Mounted component check
 */
export function useApi<T = any>(options: UseApiOptions = {}) {
  const navigate = useNavigate();
  const { onSuccess, onError, redirectOnAuth = true } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (url: string, init?: RequestInit): Promise<T | null> => {
      let mounted = true;

      setState({ data: null, loading: true, error: null });

      try {
        const response = await fetchWithAuth(url, init);

        // Handle 401 - Unauthorized
        if (response.status === 401) {
          if (redirectOnAuth) {
            navigate("/auth/login");
          }
          throw new Error("Não autorizado");
        }

        // Handle other HTTP errors
        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}`);
        }

        const jsonData = await response.json();

        // Parse JSONAPI format
        let parsedData: T;
        if (jsonData.data) {
          // Single resource or collection
          if (Array.isArray(jsonData.data)) {
            parsedData = jsonData.data.map((item: any) => ({
              id: item.id,
              ...item.attributes,
            })) as T;
          } else if (jsonData.data.attributes) {
            parsedData = {
              id: jsonData.data.id,
              ...jsonData.data.attributes,
            } as T;
          } else {
            parsedData = jsonData.data as T;
          }
        } else {
          // Plain JSON
          parsedData = jsonData as T;
        }

        if (mounted) {
          setState({ data: parsedData, loading: false, error: null });
          onSuccess?.(parsedData);
        }

        return parsedData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Erro desconhecido");

        if (mounted) {
          setState({ data: null, loading: false, error });
          onError?.(error);
        }

        return null;
      }

      // Cleanup function
      return () => {
        mounted = false;
      };
    },
    [navigate, redirectOnAuth, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook simplificado para GET requests
 */
export function useApiGet<T = any>(url: string, options: UseApiOptions = {}) {
  const api = useApi<T>(options);

  const fetch = useCallback(() => {
    return api.execute(url);
  }, [api, url]);

  return {
    ...api,
    fetch,
  };
}

/**
 * Hook para mutations (POST, PUT, PATCH, DELETE)
 */
export function useApiMutation<T = any>(options: UseApiOptions = {}) {
  const api = useApi<T>(options);

  const mutate = useCallback(
    (url: string, method: string, body?: any) => {
      return api.execute(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    },
    [api]
  );

  const post = useCallback((url: string, body?: any) => mutate(url, "POST", body), [mutate]);
  const put = useCallback((url: string, body?: any) => mutate(url, "PUT", body), [mutate]);
  const patch = useCallback((url: string, body?: any) => mutate(url, "PATCH", body), [mutate]);
  const del = useCallback((url: string) => mutate(url, "DELETE"), [mutate]);

  return {
    ...api,
    mutate,
    post,
    put,
    patch,
    delete: del,
  };
}
