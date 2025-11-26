import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth";

export interface Library {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  permission?: "owner" | "admin" | "editor" | "read_only";
  is_current?: boolean;
}

export interface CurrentUser {
  id: number;
  email: string;
  name?: string;
}

export function useLibraries() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = async () => {
    try {
      const response = await fetchWithAuth("/api/users/me");
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.data?.attributes || data);
      }
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
    }
  };

  const loadLibraries = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth("/api/libraries");
      if (response.ok) {
        const data = await response.json();
        setLibraries(data.data || []);
      } else {
        setError("Erro ao carregar bibliotecas");
      }
    } catch (err) {
      console.error("Erro ao carregar bibliotecas:", err);
      setError("Erro ao carregar bibliotecas");
    } finally {
      setLoading(false);
    }
  };

  const switchLibrary = async (libraryId: number) => {
    try {
      const response = await fetchWithAuth(`/api/libraries/${libraryId}/define_scope`, {
        method: "GET",
      });
      return response.ok;
    } catch (err) {
      console.error("Erro ao trocar biblioteca:", err);
      return false;
    }
  };

  useEffect(() => {
    loadUser();
    loadLibraries();
  }, []);

  return {
    libraries,
    currentUser,
    loading,
    error,
    loadLibraries,
    switchLibrary,
    currentLibraryId: libraries.find(lib => lib.is_current)?.id || null,
  };
}
