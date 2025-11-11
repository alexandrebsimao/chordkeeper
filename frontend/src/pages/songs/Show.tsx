import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Music2, Link as LinkIcon, Music, PlayCircle, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchWithAuth, isAuthenticated } from "@/lib/auth";

type MediaRef = {
  id?: number;
  media_type?: string | null;
  url?: string | null;
  description?: string | null;
  file_url?: string | null;
};

type ApiSong = {
  id: number;
  title: string;
  artist?: string | null;
  original_key?: string | null;
  transpose_key?: string | null;
  content?: string | null;
  attachment_url?: string | null;
  media_references?: MediaRef[];
};

const CifraView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cifra, setCifra] = useState<ApiSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!cifra) return;
    
    if (!confirm(`Tem certeza que deseja excluir "${cifra.title}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetchWithAuth(`http://localhost:3000/api/songs/${cifra.id}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao excluir música');
      }

      navigate('/songs');
    } catch (err: any) {
      console.error('Failed to delete song', err);
      alert(err.message || 'Erro ao excluir música');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated()) {
      navigate("/auth/login");
      return;
    }

    let mounted = true;
    const fetchSong = async (songId?: string) => {
      if (!songId) return;
      setLoading(true);
      try {
        const res = await fetchWithAuth(`http://localhost:3000/api/songs/${songId}`);

        if (res.status === 401) {
          navigate("/auth/login");
          return;
        }

        if (!res.ok) {
          if (res.status === 404) throw new Error('Cifra não encontrada');
          throw new Error(`HTTP ${res.status}`);
        }
        const jsonData = await res.json();
        
        // Parse JSONAPI format: { data: { attributes: {...}, relationships: {...} }, included: [...] }
        const songData = jsonData.data?.attributes || jsonData.data || jsonData;
        
        // Parse media_references from included array
        if (jsonData.included && Array.isArray(jsonData.included)) {
          songData.media_references = jsonData.included
            .filter((item: any) => item.type === 'media_reference')
            .map((item: any) => ({
              id: item.id,
              ...item.attributes
            }));
        } else {
          songData.media_references = [];
        }
        
        if (mounted) setCifra(songData as ApiSong);
      } catch (err: any) {
        console.error('Failed to fetch song', err);
        if (mounted) setError(err.message || 'Erro ao carregar cifra');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSong(id);
    return () => { mounted = false };
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando cifra...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!cifra) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cifra não encontrada</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Build media lists from media_references
  const audioFiles: { id: string; url: string; name: string }[] = (cifra.media_references || [])
    .filter(m => m.media_type === 'file' && m.file_url)
    .map(m => ({
      id: String(m.id),
      url: m.file_url || '',
      name: m.file_url?.split('/').pop()?.split('?')[0] || 'Arquivo de Áudio'
    }));

  const youtubeLinks: { id: string; url: string }[] = (cifra.media_references || [])
    .filter(m => m.media_type === 'url' && m.url?.includes('youtube.com'))
    .map(m => ({
      id: String(m.id),
      url: m.url || ''
    }));

  const spotifyLinks: { id: string; url: string }[] = (cifra.media_references || [])
    .filter(m => m.media_type === 'url' && m.url?.includes('spotify.com'))
    .map(m => ({
      id: String(m.id),
      url: m.url || ''
    }));

  const attachmentUrl = cifra.attachment_url;

  return (
    <div className="flex-1 p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground break-words">{cifra.title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{cifra.artist}</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => window.open(cifra.print_pdf, '_blank')} 
            className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
          >
            <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Button variant="outline" size="icon" onClick={() => navigate(`/songs/${cifra.id}/edit`)} className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10">
            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleDelete}
            disabled={deleting}
            className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono text-xs sm:text-sm">
            Tom: {cifra.transpose_key || cifra.original_key || '—'}
          </Badge>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50 py-2 px-3 sm:py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">
                Use fonte monoespaçada para melhor visualização
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-8">
            <pre className="font-mono text-xs sm:text-sm md:text-base whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {cifra.content || 'Nenhum conteúdo disponível.'}
            </pre>
          </CardContent>
        </Card>

        {(audioFiles.length > 0 || youtubeLinks.length > 0 || spotifyLinks.length > 0 || attachmentUrl) && (
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-3 sm:py-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                Mídia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 space-y-4">
              {attachmentUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                    <Music className="h-3 w-3 sm:h-4 sm:w-4" />
                    PDF Anexado
                  </div>
                  <div>
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                      <Music className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 truncate">Baixar PDF</span>
                    </a>
                  </div>
                </div>
              )}

              {audioFiles.length > 0 && (
                <>
                  {attachmentUrl && <Separator className="my-3" />}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                      <Music className="h-3 w-3 sm:h-4 sm:w-4" />
                      Áudio
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {audioFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-2 sm:p-3 bg-muted/50 rounded-lg border border-border/50"
                        >
                          <p className="text-xs sm:text-sm font-medium mb-2 truncate" title={file.name}>{file.name}</p>
                          <audio
                            controls
                            className="w-full h-8 sm:h-10"
                            controlsList="nodownload"
                          >
                            <source src={file.url} type="audio/mpeg" />
                            Seu navegador não suporta o elemento de áudio.
                          </audio>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {youtubeLinks.length > 0 && (
                <>
                  {(attachmentUrl || audioFiles.length > 0) && <Separator className="my-3" />}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                      <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      YouTube
                    </div>
                    <div className="space-y-2">
                      {youtubeLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm"
                        >
                          <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1 truncate">{link.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {spotifyLinks.length > 0 && (
                <>
                  {((attachmentUrl || audioFiles.length > 0) || youtubeLinks.length > 0) && <Separator className="my-3" />}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                      <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      Spotify
                    </div>
                    <div className="space-y-2">
                      {spotifyLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm"
                        >
                          <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1 truncate">{link.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CifraView;
