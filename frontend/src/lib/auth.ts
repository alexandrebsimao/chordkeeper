// Helper para fazer requisições autenticadas com JWT

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("authToken");
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = token;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export const getAuthToken = () => localStorage.getItem("authToken");

export const setAuthToken = (token: string) => localStorage.setItem("authToken", token);

export const removeAuthToken = () => localStorage.removeItem("authToken");

export const isAuthenticated = () => !!localStorage.getItem("authToken");
