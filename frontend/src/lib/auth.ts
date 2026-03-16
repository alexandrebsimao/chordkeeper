// ✅ SEGURANÇA: Helper para requisições autenticadas com JWT via HttpOnly cookies
// Migrado de localStorage para cookies HttpOnly para proteção contra XSS

import { API_BASE_URL } from "@/config/api";

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

function onRefreshed() {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: () => void) {
  refreshSubscribers.push(callback);
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    // ✅ Cookies são enviados automaticamente com credentials: 'include'
    const response = await fetch(`${API_BASE_URL}/users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Enviar cookies automaticamente
    });

    if (!response.ok) {
      // Se refresh falhar, redirecionar para login
      return false;
    }

    // Backend atualiza o cookie automaticamente
    return true;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return false;
  }
}

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // ✅ Não precisamos gerenciar tokens manualmente - cookies HttpOnly são enviados automaticamente
  
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // Só adicionar Content-Type: application/json se não for FormData
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  // ✅ SEGURANÇA: Sempre incluir credentials para enviar/receber cookies HttpOnly
  let response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: "include", // Enviar cookies automaticamente
  });

  // Se receber 401, tentar renovar o token
  if (response.status === 401 && !url.includes("/users/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshSuccess = await refreshAccessToken();
      isRefreshing = false;

      if (refreshSuccess) {
        onRefreshed();
        
        // Tentar novamente com o novo token (já no cookie)
        response = await fetch(`${API_BASE_URL}${url}`, {
          ...options,
          headers,
          credentials: "include",
        });
      } else {
        // Refresh falhou, redirecionar para login
        window.location.href = "/auth/login";
      }
    } else {
      // Aguardar o refresh em andamento
      await new Promise<void>((resolve) => {
        addRefreshSubscriber(() => {
          resolve();
        });
      });

      // Tentar novamente com o token renovado (já no cookie)
      response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
        credentials: "include",
      });
    }
  }

  return response;
};

// ✅ Funções de autenticação simplificadas - não usamos mais localStorage
// Os tokens estão em cookies HttpOnly gerenciados pelo backend

export const isAuthenticated = async (): Promise<boolean> => {
  // Verificar autenticação fazendo uma requisição leve ao backend
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: "GET",
      credentials: "include",
    });
    return response.ok;
  } catch {
    return false;
  }
};

// ✅ Compatibilidade com código existente - mas tokens não estão mais no localStorage
export const getAuthToken = () => null; // Tokens estão em cookies HttpOnly (não acessíveis via JS)
export const setAuthToken = () => {}; // Não necessário - backend gerencia cookies
export const removeAuthToken = () => {}; // Logout via API limpa os cookies
export const getRefreshToken = () => null; // Não acessível via JS
export const setRefreshToken = () => {}; // Backend gerencia
export const removeRefreshToken = () => {}; // Logout via API limpa
