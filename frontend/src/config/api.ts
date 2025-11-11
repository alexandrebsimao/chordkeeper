// Configuração da URL base da API
// Em produção, usa a variável de ambiente VITE_API_URL
// Em desenvolvimento, usa localhost:3000
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper para construir URLs completas da API
export const apiUrl = (path: string): string => {
  // Remove barra inicial se existir para evitar duplicação
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
