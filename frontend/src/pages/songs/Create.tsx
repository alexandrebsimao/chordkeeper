import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useLibraries } from "@/hooks/use-libraries";
import { SongForm, SongFormData } from "@/components/SongForm";

const CreateSong = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { libraries, loading: librariesLoading } = useLibraries();
  const { canEdit } = usePermissions();
  
  useRequireAuth();
  
  useEffect(() => {
    // Só verifica permissão após carregar as libraries completamente
    if (librariesLoading) {
      return;
    }
    
    // Busca a biblioteca atual
    const currentLibrary = libraries.find(lib => lib.is_current);
    if (!currentLibrary) {
      return;
    }
    
    // Verifica a permissão diretamente da currentLibrary
    const hasEditPermission = ['owner', 'admin', 'editor'].includes(currentLibrary.permission || '');
    
    if (!hasEditPermission) {
      navigate("/songs");
    }
  }, [libraries, librariesLoading, navigate]);

  const handleSubmit = async (formData: SongFormData) => {
    setLoading(true);
    setError(null);

    try {
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

        <SongForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/songs")}
          submitLabel="Criar Música"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CreateSong;
