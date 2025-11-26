import { useState } from "react";
import { Plus, Trash2, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeySelector } from "@/components/KeySelector";

export interface MediaReference {
  id?: number;
  media_type: "url" | "file";
  url: string;
  attachment?: File | null;
  file_url?: string | null;
  file_name?: string | null;
  description: string;
  _destroy?: boolean;
}

export interface SongFormData {
  title: string;
  artist: string;
  genre: string;
  original_key: string;
  bpm: number | null;
  capo: number | null;
  content: string;
  convert_pdf: boolean;
  attachment?: File | null;
  attachment_url?: string | null;
  media_references: MediaReference[];
}

interface SongFormProps {
  initialData?: Partial<SongFormData>;
  onSubmit: (data: SongFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
}

/**
 * Unified form component for creating and editing songs.
 * 
 * @example
 * ```tsx
 * // Create mode
 * <SongForm 
 *   onSubmit={handleCreate}
 *   onCancel={() => navigate('/songs')}
 *   submitLabel="Criar Música"
 * />
 * 
 * // Edit mode
 * <SongForm 
 *   initialData={existingSong}
 *   onSubmit={handleUpdate}
 *   onCancel={() => navigate(`/songs/${id}`)}
 *   submitLabel="Salvar Alterações"
 * />
 * ```
 */
export function SongForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
  loading = false,
}: SongFormProps) {
  const [contentTab, setContentTab] = useState<"text" | "file">(
    initialData?.attachment_url && !initialData?.content ? "file" : "text"
  );

  const [formData, setFormData] = useState<SongFormData>({
    title: initialData?.title || "",
    artist: initialData?.artist || "",
    genre: initialData?.genre || "",
    original_key: initialData?.original_key || "",
    bpm: initialData?.bpm || null,
    capo: initialData?.capo || null,
    content: initialData?.content || "",
    convert_pdf: initialData?.convert_pdf || false,
    attachment: initialData?.attachment || null,
    attachment_url: initialData?.attachment_url || null,
    media_references: initialData?.media_references || [],
  });

  const handleAddMediaReference = () => {
    setFormData({
      ...formData,
      media_references: [
        ...formData.media_references,
        {
          media_type: "url",
          url: "",
          attachment: null,
          description: "",
        },
      ],
    });
  };

  const handleRemoveMediaReference = (index: number) => {
    const updated = [...formData.media_references];
    if (updated[index].id) {
      // Mark for deletion if it has an ID (existing record)
      updated[index]._destroy = true;
    } else {
      // Remove from array if it's new
      updated.splice(index, 1);
    }
    setFormData({ ...formData, media_references: updated });
  };

  const handleMediaReferenceChange = (
    index: number,
    field: string,
    value: any
  ) => {
    const updated = [...formData.media_references];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, media_references: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Nome da música"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Artista *</Label>
            <Input
              id="artist"
              placeholder="Nome do artista"
              value={formData.artist}
              onChange={(e) =>
                setFormData({ ...formData, artist: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Gênero</Label>
              <Input
                id="genre"
                placeholder="Ex: Pop, Rock"
                value={formData.genre}
                onChange={(e) =>
                  setFormData({ ...formData, genre: e.target.value })
                }
              />
            </div>

            <KeySelector
              value={formData.original_key}
              onChange={(value) =>
                setFormData({ ...formData, original_key: value })
              }
              label="Tom Original *"
              placeholder="Selecione o tom"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                placeholder="120"
                value={formData.bpm || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bpm: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capo">Capotraste</Label>
              <Input
                id="capo"
                type="number"
                placeholder="0"
                min="0"
                max="12"
                value={formData.capo || ""}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  const limitedValue = value !== null ? Math.max(0, Math.min(12, value)) : null;
                  setFormData({
                    ...formData,
                    capo: limitedValue,
                  });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Cifra/Conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={contentTab} onValueChange={(value: any) => setContentTab(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="gap-2">
                <FileText className="h-4 w-4" />
                Digitar
              </TabsTrigger>
              <TabsTrigger value="file" className="gap-2">
                <Upload className="h-4 w-4" />
                Anexar arquivo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-4 space-y-2">
              <Label htmlFor="content">Cifra *</Label>
              <Textarea
                id="content"
                placeholder="Cole aqui a cifra da música..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={12}
                className="font-mono text-sm"
                required={contentTab === "text"}
              />
            </TabsContent>

            <TabsContent value="file" className="mt-4 space-y-2">
              <Label htmlFor="attachment">Arquivo (PDF ou DOC)</Label>
              
              {formData.attachment_url && !formData.attachment && (
                <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📄 Arquivo atual anexado
                  </p>
                  <a 
                    href={formData.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ver arquivo atual
                  </a>
                </div>
              )}
              
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Input
                  id="attachment"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attachment: e.target.files?.[0] || null,
                    })
                  }
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {formData.attachment 
                    ? `📄 ${formData.attachment.name}` 
                    : formData.attachment_url 
                    ? "Selecione um novo arquivo para substituir" 
                    : "Selecione um arquivo"}
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={formData.convert_pdf}
                  onChange={(e) =>
                    setFormData({ ...formData, convert_pdf: e.target.checked })
                  }
                />
                <span className="text-sm">Converter PDF para cifra automaticamente</span>
              </label>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mídias de Referência */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mídias de Referência</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMediaReference}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.media_references.filter(m => !m._destroy).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma mídia de referência. Clique em "Adicionar" para incluir.
            </p>
          ) : (
            formData.media_references.map((media, index) => 
              !media._destroy && (
                <div
                  key={index}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <select
                      value={media.media_type}
                      onChange={(e) =>
                        handleMediaReferenceChange(
                          index,
                          "media_type",
                          e.target.value
                        )
                      }
                      className="px-3 py-2 border rounded-md bg-white text-sm"
                    >
                      <option value="url">URL</option>
                      <option value="file">Arquivo</option>
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMediaReference(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  {media.media_type === "url" ? (
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        placeholder="https://..."
                        value={media.url}
                        onChange={(e) =>
                          handleMediaReferenceChange(index, "url", e.target.value)
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Arquivo</Label>
                      {media.file_url && !media.attachment && (
                        <div className="p-2 sm:p-3 bg-muted/50 rounded-lg border border-border/50">
                          <p className="text-xs sm:text-sm font-medium mb-2 truncate" title={media.file_name || ''}>
                            {media.file_name || 'Arquivo anexado'}
                          </p>
                          <audio
                            controls
                            className="w-full h-8 sm:h-10"
                            controlsList="nodownload"
                          >
                            <source src={media.file_url} type="audio/mpeg" />
                            Seu navegador não suporta o elemento de áudio.
                          </audio>
                        </div>
                      )}
                      <Input
                        type="file"
                        onChange={(e) =>
                          handleMediaReferenceChange(
                            index,
                            "attachment",
                            e.target.files?.[0] || null
                          )
                        }
                      />
                      {media.attachment && (
                        <p className="text-sm text-muted-foreground">
                          📄 {media.attachment.name}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      placeholder="Ex: Versão original"
                      value={media.description}
                      onChange={(e) =>
                        handleMediaReferenceChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              )
            )
          )}
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
