import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth";

export interface CurrentUser {
  id: number;
  email: string;
  name?: string;
  role?: string;
  admin?: boolean;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log("[useCurrentUser] Iniciando carregamento do usuário...");
        const response = await fetchWithAuth("/api/users/me");
        
        console.log("[useCurrentUser] Response status:", response.status);
        
        if (!response.ok) {
          console.error("[useCurrentUser] Erro na resposta:", response.status);
          const text = await response.text();
          console.error("[useCurrentUser] Response body:", text);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log("[useCurrentUser] Resposta JSON:", JSON.stringify(data, null, 2));
        
        // Extrair dados em diferentes formatos possíveis
        let userId: number | null = null;
        let email: string = "";
        let name: string | undefined = "";
        let role: string | undefined = undefined;
        let admin = false;
        
        // Formato JSONAPI: { data: { id, attributes: { email, name, ... } } }
        if (data.data) {
          userId = data.data.id;
          if (data.data.attributes) {
            email = data.data.attributes.email;
            name = data.data.attributes.name;
            role = data.data.attributes.role;
            admin = Boolean(data.data.attributes.admin);
          }
        } else if (data.id) {
          // Formato simples: { id, email, name, ... }
          userId = data.id;
          email = data.email;
          name = data.name;
          role = data.role;
          admin = Boolean(data.admin);
        }
        
        if (!userId || !email) {
          console.error("[useCurrentUser] Dados inválidos:", { userId, email });
          setLoading(false);
          return;
        }
        
        const user: CurrentUser = {
          id: userId,
          email,
          name: name || undefined,
          role,
          admin,
        };
        
        console.log("[useCurrentUser] Usuário carregado com sucesso:", user);
        setCurrentUser(user);
      } catch (err) {
        console.error("[useCurrentUser] Erro ao carregar usuário:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { currentUser, loading };
}
