import BaseApiService from "./base";

export interface Library {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  permission?: "owner" | "admin" | "editor" | "read_only";
  is_current?: boolean;
}

/**
 * Service para operações com Libraries (Bibliotecas)
 */
class LibrariesService extends BaseApiService {
  private basePath = "/api/libraries";

  /**
   * Lista todas as bibliotecas do usuário
   */
  async list(): Promise<Library[]> {
    return this.get<Library[]>(this.basePath);
  }

  /**
   * Busca uma biblioteca por ID
   */
  async getById(id: number): Promise<Library> {
    return this.get<Library>(`${this.basePath}/${id}`);
  }

  /**
   * Define uma biblioteca como escopo atual
   */
  async setCurrentScope(libraryId: number): Promise<{ message: string; current_library_id: number }> {
    return this.post<{ message: string; current_library_id: number }>(
      `${this.basePath}/${libraryId}/define_scope`
    );
  }
}

export const librariesService = new LibrariesService();
