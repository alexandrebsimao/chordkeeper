import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, FileText, Upload, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchWithAuth, isAuthenticated } from "@/lib/auth";

interface MediaReference {
  id?: number;
  media_type: "url" | "file";
  url: string;
  attachment?: File | null;
  file_url?: string | null;
  description: string;
  _destroy?: boolean;
}

interface FormData {
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

const EditSong = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<"text" | "file">("text");
  const [formData, setFormData] = useState<FormData>({
    title: "",
    artist: "",
    genre: "",
    original_key: "",
    bpm: null,
    capo: null,
    content: "",
    convert_pdf: false,
    attachment: null,
    attachment_url: null,
    media_references: [],
  });

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated()) {
      navigate("/auth/login");
      return;
    }

    const fetchSong = async () => {
      if (!id) return;
      
      setLoadingData(true);
      try {
        const res = await fetchWithAuth(`http://localhost:3000/api/songs/${id}`);

        if (res.status === 401) {
          navigate("/auth/login");
          return;
        }

        if (!res.ok) {
          throw new Error('Erro ao carregar música');
        }
        const jsonData = await res.json();
        
        // Parse JSONAPI format
        const songData = jsonData.data?.attributes || jsonData.data || jsonData;
        
        // Parse media_references from included array
        let mediaRefs: MediaReference[] = [];
        if (jsonData.included && Array.isArray(jsonData.included)) {
          mediaRefs = jsonData.included
            .filter((item: any) => item.type === 'media_reference')
            .map((item: any) => ({
              id: item.id,
              ...item.attributes,
              _destroy: false
            }));
        }
        
        setFormData({
          title: songData.title || "",
          artist: songData.artist || "",
          genre: songData.genre || "",
          original_key: songData.original_key || "",
          bpm: songData.bpm || null,
          capo: songData.capo || null,
          content: songData.content || "",
          convert_pdf: false,
          attachment: null,
          attachment_url: songData.attachment_url || null,
          media_references: mediaRefs,
        });
        
        // Set tab based on existing content
        if (songData.attachment_url && !songData.content) {
          setContentTab("file");
        }
      } catch (err: any) {
        console.error('Failed to fetch song', err);
        setError(err.message || 'Erro ao carregar música');
      } finally {
        setLoadingData(false);
      }
    };

    fetchSong();
  }, [id]);

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
      // Se tem ID, marca para destruição
      updated[index]._destroy = true;
    } else {
      // Se é novo, remove do array
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
    setLoading(true);
    setError(null);

    try {
      // Preparar FormData para envio com arquivos
      const formDataToSend = new FormData();

      // Adicionar campos simples
      formDataToSend.append("song[title]", formData.title);
      formDataToSend.append("song[artist]", formData.artist);
      formDataToSend.append("song[genre]", formData.genre);
      formDataToSend.append("song[original_key]", formData.original_key);
      if (formData.bpm) formDataToSend.append("song[bpm]", formData.bpm.toString());
      if (formData.capo) formDataToSend.append("song[capo]", formData.capo.toString());
      formDataToSend.append("song[content]", formData.content);
      formDataToSend.append("song[convert_pdf]", formData.convert_pdf ? "1" : "0");

      // Adicionar attachment da música se houver um novo arquivo
      if (formData.attachment) {
        formDataToSend.append("song[attachment]", formData.attachment);
      }

      // Adicionar media_references
      formData.media_references.forEach((media, index) => {
        if (media._destroy) {
          if (media.id) {
            formDataToSend.append(
              `song[media_references_attributes][${index}][id]`,
              media.id.toString()
            );
            formDataToSend.append(
              `song[media_references_attributes][${index}][_destroy]`,
              "1"
            );
          }
        } else {
          if (media.id) {
            formDataToSend.append(
              `song[media_references_attributes][${index}][id]`,
              media.id.toString()
            );
          }
          formDataToSend.append(
            `song[media_references_attributes][${index}][media_type]`,
            media.media_type
          );
          formDataToSend.append(
            `song[media_references_attributes][${index}][url]`,
            media.url
          );
          formDataToSend.append(
            `song[media_references_attributes][${index}][description]`,
            media.description
          );

          if (media.attachment) {
            formDataToSend.append(
              `song[media_references_attributes][${index}][attachment]`,
              media.attachment
            );
          }
        }
      });

      // Enviar para API com PATCH
      const response = await fetchWithAuth(`http://localhost:3000/api/songs/${id}`, {
        method: "PATCH",
        body: formDataToSend,
      });

      if (response.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP ${response.status}`
        );
      }

      const result = await response.json();
      navigate(`/songs/${result.data.id}`);
    } catch (err: any) {
      console.error("Error updating song:", err);
      setError(err.message || "Erro ao atualizar música");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando música...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
          <Button onClick={() => navigate("/songs")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/songs/${id}`)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Editar Música</h1>
          </div>
          <p className="text-muted-foreground ml-12">Atualize os dados da cifra</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

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

                <div className="space-y-2">
                  <Label htmlFor="original_key">Tom Original *</Label>
                  <Input
                    id="original_key"
                    placeholder="Ex: C, G, Am"
                    value={formData.original_key}
                    onChange={(e) =>
                      setFormData({ ...formData, original_key: e.target.value })
                    }
                    required
                  />
                </div>
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
                    value={formData.capo || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capo: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
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
                    required
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
                            <div className="mb-2 p-2 bg-muted/50 rounded text-sm">
                              <a 
                                href={media.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                📎 Ver arquivo atual
                              </a>
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
              onClick={() => navigate(`/songs/${id}`)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSong;
