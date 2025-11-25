// Helper para fazer requisições autenticadas com JWT

import { API_BASE_URL } from "@/config/api";

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
    (headers as Record<string, string>)["Authorization"] = `${token}`;
  }

  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
};

export const getAuthToken = () => localStorage.getItem("authToken");

export const setAuthToken = (token: string) => localStorage.setItem("authToken", token);

export const removeAuthToken = () => localStorage.removeItem("authToken");

export const isAuthenticated = () => !!localStorage.getItem("authToken");
