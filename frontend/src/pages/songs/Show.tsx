import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Music2, Link as LinkIcon, Music, PlayCircle, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchWithAuth, isAuthenticated } from "@/lib/auth";
import PrintOptionsDialog from "@/components/PrintOptionsDialog";
import SimplePdfViewer from "@/components/SimplePdfViewer";

type MediaRef = {
  id?: number;
  media_type?: string | null;
  url?: string | null;
  description?: string | null;
  file_url?: string | null;
  file_name?: string | null;
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [transposing, setTransposing] = useState(false);

  // Lista de tons musicais
  const musicalKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const handleTranspose = async (newKey: string) => {
    if (!cifra) return;
    
    setTransposing(true);
    try {
      const response = await fetchWithAuth(`/api/songs/${cifra.id}/transpose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transpose_key: newKey }),
      });

      if (response.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao transpor música');
      }

      const jsonData = await response.json();
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
      
      setCifra(songData as ApiSong);
    } catch (err: any) {
      console.error('Failed to transpose song', err);
      alert(err.message || 'Erro ao transpor música');
    } finally {
      setTransposing(false);
    }
  };

  const handleDownloadPdf = async (fontSize: number = 16) => {
    if (!cifra) return;
    
    setDownloadingPdf(true);
    try {
      const response = await fetchWithAuth(`/api/songs/${cifra.id}/generate_pdf?font_size=${fontSize}`);

      if (response.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      // Obter o blob do PDF
      const blob = await response.blob();
      
      // Criar URL temporária para o blob
      const url = window.URL.createObjectURL(blob);
      
      // Abrir PDF em nova aba
      window.open(url, '_blank');
      
      // Limpar URL após um pequeno delay para garantir que abriu
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      // Fechar o dialog após sucesso
      setPrintDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to download PDF', err);
      alert(err.message || 'Erro ao gerar PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDelete = async () => {
    if (!cifra) return;
    
    if (!confirm(`Tem certeza que deseja excluir "${cifra.title}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetchWithAuth(`/api/songs/${cifra.id}`, {
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
        const res = await fetchWithAuth(`/api/songs/${songId}`);

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
          <Button onClick={() => navigate("/songs")} className="mt-4">
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
          <Button onClick={() => navigate("/songs")} className="mt-4">
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
      name: m.file_url?.split('/').pop()?.split('?')[0] || 'Arquivo de Áudio',
      file_name: m.file_name || 'Arquivo de Áudio'
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
              onClick={() => navigate("/songs")}
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
            onClick={() => setPrintDialogOpen(true)}
            disabled={downloadingPdf}
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

        <div className="flex gap-3 flex-wrap items-center">
          <Badge variant="outline" className="font-mono text-xs">
            Tom Original: {cifra.original_key || '—'}
          </Badge>
          
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Transpor para:</span>
            <Select 
              value={cifra.transpose_key || cifra.original_key || ''} 
              onValueChange={handleTranspose}
              disabled={transposing || !cifra.original_key}
            >
              <SelectTrigger className="w-[80px] h-6 font-mono text-xs">
                <SelectValue placeholder="Tom" />
              </SelectTrigger>
              <SelectContent>
                {musicalKeys.map((key) => (
                  <SelectItem key={key} value={key} className="font-mono">
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cifra.transpose_key && cifra.transpose_key !== cifra.original_key && (
              <Badge variant="secondary" className="font-mono text-xs">
                Transposto: {cifra.transpose_key}
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-xs">
              Capotraste: {cifra.capo ? `${cifra.capo}ª casa` : '—'}
            </Badge>
          </div>
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
            {!cifra?.content && !cifra?.content_format && cifra?.attachment_url ? (
              <SimplePdfViewer url={cifra.attachment_url} />
            ) : (
              <div 
                className="cifra-content font-mono text-xs sm:text-sm md:text-base whitespace-pre-wrap leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: cifra.content_format || 'Nenhum conteúdo disponível.' }}
              />
            )}

            <style>{`
              .cifra-content .chord-line, .chord {
                color: #2563eb;
                font-weight: bold;
                padding: 0;
                margin: 0;
              }

              .cifra-content .notation {
                color: #d97706;
                font-style: italic;
              }
            `}</style>
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
                          <p className="text-xs sm:text-sm font-medium mb-2 truncate" title={file.file_name}>{file.file_name}</p>
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

      <PrintOptionsDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        onPrint={handleDownloadPdf}
        isPrinting={downloadingPdf}
      />
    </div>
  );
};

export default CifraView;
