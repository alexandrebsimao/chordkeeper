import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useLibraries } from "@/hooks/use-libraries";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { SongForm, SongFormData, MediaReference } from "@/components/SongForm";

const EditSong = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<SongFormData> | null>(null);
  const { currentLibrary, loading: librariesLoading } = useLibraries();
  const { canEdit } = usePermissions();
  
  useRequireAuth();

  useEffect(() => {
    // Só verifica permissão após carregar completamente
    if (librariesLoading) {
      return;
    }
    
    // Se não há biblioteca atual após o loading, algo está errado
    if (!currentLibrary) {
      console.log('No current library found after loading');
      return;
    }
    
    // Verifica a permissão DIRETAMENTE da currentLibrary
    const hasEditPermission = ['owner', 'admin', 'editor'].includes(currentLibrary.permission || '');
    
    if (!hasEditPermission) {
      console.log('No edit permission - redirecting to /songs');
      navigate("/songs");
      return;
    }

    const fetchSong = async () => {
      if (!id) return;
      
      setLoadingData(true);
      try {
        const res = await fetchWithAuth(`/api/songs/${id}`);

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
        
        setInitialData({
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
      } catch (err: any) {
        console.error('Failed to fetch song', err);
        setError(err.message || 'Erro ao carregar música');
      } finally {
        setLoadingData(false);
      }
    };

    fetchSong();
  }, [id, navigate, currentLibrary, librariesLoading]);

  const handleSubmit = async (formData: SongFormData) => {
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      // Adicionar campos simples
      formDataToSend.append("song[title]", formData.title || '');
      formDataToSend.append("song[artist]", formData.artist || '');
      formDataToSend.append("song[genre]", formData.genre || '');
      formDataToSend.append("song[original_key]", formData.original_key || '');
      formDataToSend.append("song[bpm]", formData.bpm ? formData.bpm.toString() : '');
      formDataToSend.append("song[capo]", formData.capo ? formData.capo.toString() : '');
      formDataToSend.append("song[content]", formData.content || '');
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
            media.media_type || ''
          );
          if (media.url) {
            formDataToSend.append(
              `song[media_references_attributes][${index}][url]`,
              media.url
            );
          }
          if (media.description) {
            formDataToSend.append(
              `song[media_references_attributes][${index}][description]`,
              media.description
            );
          }

          if (media.attachment) {
            formDataToSend.append(
              `song[media_references_attributes][${index}][attachment]`,
              media.attachment
            );
          }
        }
      });

      // Enviar para API com PATCH
      const response = await fetchWithAuth(`/api/songs/${id}`, {
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
    return <LoadingState message="Carregando música..." />;
  }

  if (error && !initialData) {
    return (
      <div className="flex-1 p-6 pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <ErrorState error={error} />
          <div className="text-center mt-4">
            <Button onClick={() => navigate("/songs")}>
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return null;
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

        <SongForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/songs/${id}`)}
          submitLabel="Salvar Alterações"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default EditSong;
