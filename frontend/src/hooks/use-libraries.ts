import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth";

const CURRENT_LIBRARY_KEY = "chord_keeper_current_library_id";

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
        setLibraries(data.data?.attributes?.library ? [data.data.attributes.library] : []);

      }
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
    }
  };

  // const loadLibraries = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await fetchWithAuth("/api/libraries");
  //     if (response.ok) {
  //       const data = await response.json();
  //       const loadedLibraries = data.data || [];
  //       setLibraries(loadedLibraries);
        
  //       // Salva o ID da biblioteca atual no localStorage
  //       const currentLib = loadedLibraries.find((lib: Library) => lib.is_current);
  //       if (currentLib) {
  //         localStorage.setItem(CURRENT_LIBRARY_KEY, currentLib.id.toString());
  //       }
  //     } else {
  //       setError("Erro ao carregar bibliotecas");
  //     }
  //   } catch (err) {
  //     console.error("Erro ao carregar bibliotecas:", err);
  //     setError("Erro ao carregar bibliotecas");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const switchLibrary = async (libraryId: number) => {
  //   try {
  //     const response = await fetchWithAuth(`/api/libraries/${libraryId}/define_scope`, {
  //       method: "GET",
  //     });
      
  //     if (response.ok) {
  //       // Salva no localStorage imediatamente
  //       localStorage.setItem(CURRENT_LIBRARY_KEY, libraryId.toString());
        
  //       // Atualiza o estado local
  //       setLibraries(prev => 
  //         prev.map(lib => ({
  //           ...lib,
  //           is_current: lib.id === libraryId
  //         }))
  //       );
        
  //       // Recarrega as bibliotecas para ter os dados atualizados do backend
  //       await loadLibraries();
  //     }
      
  //     return response.ok;
  //   } catch (err) {
  //     console.error("Erro ao trocar biblioteca:", err);
  //     return false;
  //   }
  // };

  useEffect(() => {
    loadUser();
    // loadLibraries();
  }, []);

  return {
    libraries,
    currentUser,
    loading,
    error,
    // loadLibraries,
    // switchLibrary,
    currentLibrary: currentUser?.library || null,
  };
}
