import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchWithAuth, isAuthenticated } from "@/lib/auth";
import { useLibraries } from "@/hooks/use-libraries";
import { usePermissions } from "@/hooks/use-permissions";

interface MediaReference {
  id?: number;
  media_type: "url" | "file";
  url: string;
  attachment?: File | null;
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
  media_references: MediaReference[];
}

const CreateSong = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<"text" | "file">("text");
  const { libraries } = useLibraries();
  const { canEdit } = usePermissions();
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
    media_references: [],
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/auth/login");
      return;
    }

    // Verificar permissão
    if (!canEdit()) {
      navigate("/songs");
    }
  }, [navigate, canEdit]);

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated()) {
      navigate("/auth/login");
    }
  }, [navigate]);

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
      formDataToSend.append("song[bpm]", formData.bpm ? formData.bpm.toString() : '');
      formDataToSend.append("song[capo]", formData.capo ? formData.capo.toString() : '');
      formDataToSend.append("song[content]", formData.content);
      formDataToSend.append("song[convert_pdf]", formData.convert_pdf ? "1" : "0");

      // Adicionar attachment da música se houver
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

      // Enviar para API
      const response = await fetchWithAuth("/api/songs", {
        method: "POST",
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
      console.error("Error creating song:", err);
      setError(err.message || "Erro ao criar música");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/songs")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Nova Música</h1>
          </div>
          <p className="text-muted-foreground ml-12">Preencha os dados abaixo para criar uma nova cifra</p>
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
                    min="0"
                    max="12"
                    value={formData.capo || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : null;
                      // Limitar entre 0 e 12
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
                    required
                  />
                </TabsContent>

                <TabsContent value="file" className="mt-4 space-y-2">
                  <Label htmlFor="attachment">Arquivo (PDF ou DOC) *</Label>
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
                      {formData.attachment ? `📄 ${formData.attachment.name}` : "Selecione um arquivo"}
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
              {formData.media_references.map((media, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg space-y-3 ${
                    media._destroy ? "opacity-50" : ""
                  }`}
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
              ))}
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/songs")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Música"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSong;
