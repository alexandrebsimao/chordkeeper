/**
 * Utilitários de formatação e parsing
 */

/**
 * Parse JSONAPI format para objeto simples
 */
export function parseJsonApi<T>(data: any): T {
  if (!data) return data;

  // Array de recursos
  if (data.data && Array.isArray(data.data)) {
    return data.data.map((item: any) => ({
      id: item.id,
      ...item.attributes,
    })) as T;
  }

  // Recurso único
  if (data.data && data.data.attributes) {
    return {
      id: data.data.id,
      ...data.data.attributes,
    } as T;
  }

  // Recurso único sem attributes
  if (data.data) {
    return data.data as T;
  }

  // JSON normal
  return data as T;
}

/**
 * Formata tom musical
 */
export function formatMusicalKey(key: string | null | undefined): string {
  return key || "—";
}

/**
 * Formata capotraste
 */
export function formatCapo(capo: number | null | undefined): string {
  if (!capo || capo === 0) return "—";
  return `${capo}ª casa`;
}

/**
 * Formata data
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formata data com hora
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Trunca texto
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Extrai ID do YouTube de uma URL
 */
export function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Extrai ID do Spotify de uma URL
 */
export function extractSpotifyId(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Valida URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formata mensagem de erro da API
 */
export function formatApiError(error: any): string {
  if (typeof error === "string") return error;
  
  if (error.message) return error.message;
  
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors[0] || "Erro desconhecido";
  }
  
  if (error.error) return error.error;
  
  return "Erro desconhecido";
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
