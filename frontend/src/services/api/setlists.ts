import BaseApiService from "./base";

export interface Setlist {
  id: number;
  title: string;
  description?: string;
  songs?: SetlistSong[];
  public_link?: {
    uuid: string;
    url: string;
  };
  library_id?: number;
}

export interface SetlistSong {
  id: number;
  title: string;
  artist?: string;
  original_key?: string;
  transpose_key?: string;
}

export interface CreateSetlistData {
  title: string;
  description?: string;
}

/**
 * Service para operações com Setlists
 */
class SetlistsService extends BaseApiService {
  private basePath = "/api/setlists";

  /**
   * Lista todos os setlists com paginação
   */
  async list(page = 1, perPage = 6): Promise<Setlist[]> {
    return this.get<Setlist[]>(`${this.basePath}?page=${page}&per_page=${perPage}`);
  }

  /**
   * Busca um setlist por ID
   */
  async getById(id: number): Promise<Setlist> {
    return this.get<Setlist>(`${this.basePath}/${id}`);
  }

  /**
   * Cria um novo setlist
   */
  async create(data: CreateSetlistData): Promise<Setlist> {
    return this.post<Setlist>(this.basePath, { setlist: data });
  }

  /**
   * Deleta um setlist
   */
  async delete(id: number): Promise<void> {
    return this.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Adiciona uma música ao setlist
   */
  async addSong(setlistId: number, songId: number): Promise<Setlist> {
    return this.post<Setlist>(`${this.basePath}/${setlistId}/add_song`, {
      song_id: songId,
    });
  }

  /**
   * Remove uma música do setlist
   */
  async removeSong(setlistId: number, songId: number): Promise<Setlist> {
    return this.post<Setlist>(`${this.basePath}/${setlistId}/remove_song`, {
      song_id: songId,
    });
  }

  /**
   * Reordena as músicas do setlist
   */
  async reorderSongs(setlistId: number, songIds: number[]): Promise<Setlist> {
    return this.post<Setlist>(`${this.basePath}/${setlistId}/reorder_songs`, {
      song_ids: songIds,
    });
  }

  /**
   * Gera PDF do setlist
   */
  async generatePdf(setlistId: number, fontSize = 16): Promise<Blob> {
    const response = await fetchWithAuth(
      `${this.basePath}/${setlistId}/print?font_size=${fontSize}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Gera link público para o setlist
   */
  async generatePublicLink(setlistId: number): Promise<{ uuid: string; url: string }> {
    return this.post<{ uuid: string; url: string }>(
      `${this.basePath}/${setlistId}/public_link_generator`
    );
  }

  /**
   * Remove link público do setlist
   */
  async destroyPublicLink(setlistId: number): Promise<void> {
    return this.post<void>(`${this.basePath}/${setlistId}/public_link_destroyer`);
  }
}

export const setlistsService = new SetlistsService();
