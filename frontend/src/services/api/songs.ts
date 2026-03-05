import BaseApiService from "./base";

export interface Song {
  id: number;
  title: string;
  artist?: string;
  original_key?: string;
  transpose_key?: string;
  content?: string;
  attachment_url?: string;
  media_references?: MediaReference[];
  library_id?: number;
}

export interface MediaReference {
  id?: number;
  media_type?: string;
  url?: string;
  description?: string;
  file_url?: string;
  file_name?: string;
}

export interface CreateSongData {
  title: string;
  artist?: string;
  original_key?: string;
  content?: string;
  media_references_attributes?: any[];
  attachment?: File;
}

/**
 * Service para operações com Songs (Cifras)
 */
class SongsService extends BaseApiService {
  private basePath = "/api/songs";

  /**
   * Lista todas as músicas com paginação
   */
  async list(page = 1, perPage = 6): Promise<Song[]> {
    return this.get<Song[]>(`${this.basePath}?page=${page}&per_page=${perPage}`);
  }

  /**
   * Busca músicas por termo
   */
  async search(query: string, perPage = 1000): Promise<Song[]> {
    return this.get<Song[]>(
      `${this.basePath}?search=${encodeURIComponent(query)}&per_page=${perPage}`
    );
  }

  /**
   * Busca uma música por ID
   */
  async getById(id: number): Promise<Song> {
    return this.get<Song>(`${this.basePath}/${id}`);
  }

  /**
   * Cria uma nova música
   */
  async create(data: CreateSongData): Promise<Song> {
    const formData = new FormData();
    
    formData.append("song[title]", data.title);
    if (data.artist) formData.append("song[artist]", data.artist);
    if (data.original_key) formData.append("song[original_key]", data.original_key);
    if (data.content) formData.append("song[content]", data.content);
    if (data.attachment) formData.append("song[attachment]", data.attachment);

    if (data.media_references_attributes) {
      data.media_references_attributes.forEach((ref, index) => {
        Object.keys(ref).forEach((key) => {
          formData.append(
            `song[media_references_attributes][${index}][${key}]`,
            ref[key]
          );
        });
      });
    }

    const response = await fetchWithAuth(this.basePath, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const jsonData = await response.json();
    return this.parseJsonApi<Song>(jsonData);
  }

  /**
   * Atualiza uma música
   */
  async update(id: number, data: Partial<CreateSongData>): Promise<Song> {
    const formData = new FormData();
    
    if (data.title) formData.append("song[title]", data.title);
    if (data.artist) formData.append("song[artist]", data.artist);
    if (data.original_key) formData.append("song[original_key]", data.original_key);
    if (data.content) formData.append("song[content]", data.content);
    if (data.attachment) formData.append("song[attachment]", data.attachment);

    if (data.media_references_attributes) {
      data.media_references_attributes.forEach((ref, index) => {
        Object.keys(ref).forEach((key) => {
          formData.append(
            `song[media_references_attributes][${index}][${key}]`,
            ref[key]
          );
        });
      });
    }

    const response = await fetchWithAuth(`${this.basePath}/${id}`, {
      method: "PATCH",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const jsonData = await response.json();
    return this.parseJsonApi<Song>(jsonData);
  }

  /**
   * Deleta uma música
   */
  async delete(id: number): Promise<void> {
    return this.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Transpõe uma música para outra tonalidade
   */
  async transpose(id: number, transposeKey: string): Promise<Song> {
    return this.post<Song>(`${this.basePath}/${id}/transpose`, {
      transpose_key: transposeKey,
    });
  }

  /**
   * Gera PDF da música
   */
  async generatePdf(id: number, fontSize = 16): Promise<Blob> {
    const response = await fetchWithAuth(
      `${this.basePath}/${id}/generate_pdf?font_size=${fontSize}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.blob();
  }
}

export const songsService = new SongsService();
