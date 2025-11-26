import { fetchWithAuth } from "@/lib/auth";

/**
 * Base API service com métodos comuns
 */
class BaseApiService {
  protected async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetchWithAuth(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  protected parseJsonApi<T>(data: any): T {
    if (data.data) {
      if (Array.isArray(data.data)) {
        return data.data.map((item: any) => ({
          id: item.id,
          ...item.attributes,
        })) as T;
      }
      return {
        id: data.data.id,
        ...data.data.attributes,
      } as T;
    }
    return data as T;
  }

  protected async get<T>(url: string): Promise<T> {
    const data = await this.request<any>(url);
    return this.parseJsonApi<T>(data);
  }

  protected async post<T>(url: string, body?: any): Promise<T> {
    const data = await this.request<any>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseJsonApi<T>(data);
  }

  protected async patch<T>(url: string, body?: any): Promise<T> {
    const data = await this.request<any>(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseJsonApi<T>(data);
  }

  protected async put<T>(url: string, body?: any): Promise<T> {
    const data = await this.request<any>(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.parseJsonApi<T>(data);
  }

  protected async delete<T = void>(url: string): Promise<T> {
    const response = await fetchWithAuth(url, { method: "DELETE" });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // DELETE pode retornar 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }
}

export default BaseApiService;
