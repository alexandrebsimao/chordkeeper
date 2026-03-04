// Helper para fazer requisições autenticadas com JWT

import { API_BASE_URL } from "@/config/api";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      // Se refresh falhar, limpar tokens e forçar novo login
      removeAuthToken();
      removeRefreshToken();
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token.replace("Bearer ", "");
    setAuthToken(newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    removeAuthToken();
    removeRefreshToken();
    return null;
  }
}

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");
  
  // Não definir Content-Type se o body for FormData (o navegador define automaticamente com boundary)
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // Só adicionar Content-Type: application/json se não for FormData
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  if (token) {
    // Adicionar "Bearer " antes do token conforme padrão JWT
    const authToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    (headers as Record<string, string>)["Authorization"] = authToken;
  }

  let response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // Se receber 401, tentar renovar o token
  if (response.status === 401 && !url.includes("/users/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        
        // Tentar novamente com o novo token
        (headers as Record<string, string>)["Authorization"] = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE_URL}${url}`, {
          ...options,
          headers,
        });
      } else {
        // Refresh falhou, redirecionar para login
        window.location.href = "/auth/login";
      }
    } else {
      // Aguardar o refresh em andamento
      const newToken = await new Promise<string>((resolve) => {
        addRefreshSubscriber((token: string) => {
          resolve(token);
        });
      });

      // Tentar novamente com o token renovado
      (headers as Record<string, string>)["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });
    }
  }

  return response;
};

export const getAuthToken = () => localStorage.getItem("authToken");

export const setAuthToken = (token: string) => localStorage.setItem("authToken", token);

export const removeAuthToken = () => localStorage.removeItem("authToken");

export const getRefreshToken = () => localStorage.getItem("refreshToken");

export const setRefreshToken = (token: string) => localStorage.setItem("refreshToken", token);

export const removeRefreshToken = () => localStorage.removeItem("refreshToken");

export const isAuthenticated = () => !!localStorage.getItem("authToken");
