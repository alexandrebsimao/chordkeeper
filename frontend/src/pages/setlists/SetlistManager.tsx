import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  X, 
  GripVertical, 
  Music2, 
  Printer,
  Share2,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, isAuthenticated } from "@/lib/auth";
import ShareSetlistDialog from "@/components/ShareSetlistDialog";
import PrintOptionsDialog from "@/components/PrintOptionsDialog";
import ManageSetlistUsersDialog from "@/components/ManageSetlistUsersDialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePermissions } from "@/hooks/use-permissions";

type SharedUser = {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  permission: string;
};

type Song = {
  id: number;
  title: string;
  artist?: string;
  original_key?: string;
};

type Setlist = {
  id: number;
  title: string;
  description?: string;
  songs: Song[];
  total_songs: number;
  owner_id?: number;
  owner_name?: string;
  shared_users?: SharedUser[];
  public_link?: {
    uuid: string;
    url: string;
  };
  library_id?: number;
};

const SetlistManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [printingPdf, setPrintingPdf] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const { currentUser } = useCurrentUser();
  const { canEdit, canShare } = usePermissions();

  const handlePrintSetlist = async (fontSize: number = 16) => {
    if (!id) return;
    
    setPrintingPdf(true);
    try {
      const response = await fetchWithAuth(`/api/setlists/${id}/print?font_size=${fontSize}`);

      if (response.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF do setlist');
      }

      // Obter o blob do PDF
      const blob = await response.blob();
      
      // Criar URL temporária para o blob
      const url = window.URL.createObjectURL(blob);
      
      // Abrir PDF em nova aba
      window.open(url, '_blank');
      
      // Limpar URL após um pequeno delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 500);

      // Fechar o dialog após sucesso
      setPrintDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to print setlist', err);
      toast({
        title: "Erro",
        description: err.message || 'Erro ao gerar PDF',
        variant: "destructive",
      });
    } finally {
      setPrintingPdf(false);
    }
  };

  useEffect(() => {
    // Verificar autenticação
    if (!isAuthenticated()) {
      navigate("/auth/login");
      return;
    }

    fetchSetlist();
    fetchAllSongs();
  }, [id, navigate]);

  // Filter available songs based on search and setlist
  const availableSongs = allSongs
    .filter(song => !setlist?.songs.find(s => s.id === song.id))
    .filter(song => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        song.title.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query)
      );
    });

  const fetchSetlist = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/setlists/${id}`);

      if (res.status === 401) {
        navigate("/auth/login");
        return;
      }
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const jsonData = await res.json();
      
      // Parse JSONAPI format with nested songs structure
      const setlistData = jsonData.data?.attributes || jsonData.data || jsonData;
      
      // Parse songs array - each song is wrapped in { data: { attributes: {...} } }
      if (setlistData.songs && Array.isArray(setlistData.songs)) {
        setlistData.songs = setlistData.songs.map((songWrapper: any) => {
          if (songWrapper.data && songWrapper.data.attributes) {
            return songWrapper.data.attributes;
          }
          return songWrapper;
        });
      }
      
      setSetlist(setlistData as Setlist);
    } catch (err: any) {
      console.error('Failed to fetch setlist', err);
      toast({
        title: "Erro",
        description: "Erro ao carregar setlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSongs = async () => {
    setLoadingSongs(true);
    try {
      const res = await fetchWithAuth(`/api/songs?search=${encodeURIComponent(searchQuery)}&per_page=1000`);

      if (res.status === 401) {
        navigate("/auth/login");
        return;
      }
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const jsonData = await res.json();
      
      // Parse JSONAPI format
      let data: Song[] = [];
      if (jsonData.data && Array.isArray(jsonData.data)) {
        data = jsonData.data.map((item: any) => ({
          id: item.id,
          ...item.attributes
        }));
      }
      
      setAllSongs(data);
    } catch (err: any) {
      console.error('Failed to fetch songs', err);
      toast({
        title: "Erro",
        description: "Erro ao carregar músicas",
        variant: "destructive",
      });
    } finally {
      setLoadingSongs(false);
    }
  };

  const handleAddSong = async (song: Song) => {
    try {
      const res = await fetchWithAuth(`/api/setlists/${id}/add_song`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ song_id: song.id }),
      });

      if (res.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await fetchSetlist();
      toast({
        title: "Música adicionada",
        description: `${song.title} foi adicionada ao setlist.`,
      });
      setSearchQuery("");
    } catch (err: any) {
      console.error('Failed to add song', err);
      toast({
        title: "Erro",
        description: "Erro ao adicionar música",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSong = async (songId: number) => {
    try {
      const res = await fetchWithAuth(`/api/setlists/${id}/remove_song`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ song_id: songId }),
      });

      if (res.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await fetchSetlist();
      toast({
        title: "Música removida",
        description: "Música removida do setlist.",
      });
    } catch (err: any) {
      console.error('Failed to remove song', err);
      toast({
        title: "Erro",
        description: "Erro ao remover música",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    if (dragItem.current === dragOverItem.current) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    if (!setlist || !setlist.songs) return;

    // Create a copy of the songs array
    const newSongs = [...setlist.songs];
    const draggedSong = newSongs[dragItem.current];
    
    // Remove from old position and insert at new position
    newSongs.splice(dragItem.current, 1);
    newSongs.splice(dragOverItem.current, 0, draggedSong);

    // Update local state immediately for better UX
    setSetlist({ ...setlist, songs: newSongs });
    
    // Reset drag states
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItem.current = null;
    dragOverItem.current = null;

    // Send update to backend
    try {
      const res = await fetchWithAuth(`/api/setlists/${id}/reorder_songs`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          song_ids: newSongs.map(song => song.id)
        }),
      });

      if (res.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      toast({
        title: "Ordem atualizada",
        description: "A ordem das músicas foi atualizada.",
      });
    } catch (err: any) {
      console.error('Failed to reorder songs', err);
      // Revert to original order on error
      await fetchSetlist();
      toast({
        title: "Erro",
        description: "Erro ao atualizar a ordem das músicas",
        variant: "destructive",
      });
    }
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (index: number, e: TouchEvent) => {
    dragItem.current = index;
    setDraggedIndex(index);
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (dragItem.current === null || touchStartY.current === null) return;
    
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    
    // Find which item the touch is over
    const elements = document.querySelectorAll('[data-song-index]');
    let newOverIndex: number | null = null;
    
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) {
        newOverIndex = parseInt(el.getAttribute('data-song-index') || '');
      }
    });
    
    if (newOverIndex !== null && newOverIndex !== dragOverItem.current) {
      dragOverItem.current = newOverIndex;
      setDragOverIndex(newOverIndex);
    }
  };

  const handleTouchEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      touchStartY.current = null;
      return;
    }

    await handleDragEnd();
    touchStartY.current = null;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando setlist...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando setlist...</p>
        </div>
      </div>
    );
  }

  if (!setlist) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Setlist não encontrado</p>
          <Button onClick={() => navigate("/setlists")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/setlists")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{setlist.title}</h1>
              {setlist.description && (
                <p className="text-muted-foreground">{setlist.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="icon"
              onClick={() => navigate(`/setlist/${id}/play`)}
              title="Modo Apresentação"
              disabled={setlist.songs.length === 0}
            >
              <Play className="h-5 w-5" />
            </Button>
            {setlist.owner_id === currentUser?.id && (
              <ManageSetlistUsersDialog
                setlistId={setlist.id}
                setlistTitle={setlist.title}
                isOwner={true}
                variant="outline"
                size="icon"
              />
            )}
            {canShare(setlist.library_id) && (
              <ShareSetlistDialog
                setlistId={setlist.id}
                setlistTitle={setlist.title}
                publicLink={setlist.public_link}
                onLinkGenerated={fetchSetlist}
                variant="outline"
                iconSize="md"
              />
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPrintDialogOpen(true)}
              disabled={printingPdf}
              title="Imprimir setlist"
            >
              <Printer className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Available Songs */}
          <Card>
            <CardHeader>
              <CardTitle>Músicas Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Buscar por título ou artista..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="max-h-[600px] overflow-y-auto space-y-2">
                  {loadingSongs ? (
                    <p className="text-center text-muted-foreground py-8">
                      Carregando músicas...
                    </p>
                  ) : availableSongs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {searchQuery ? 'Nenhuma música encontrada' : 'Todas as músicas já estão no setlist'}
                    </p>
                  ) : (
                    availableSongs.map((song) => (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors group"
                        style={{ cursor: canEdit(setlist.library_id) ? 'pointer' : 'default' }}
                        onClick={() => canEdit(setlist.library_id) && handleAddSong(song)}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{song.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {song.artist}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {song.original_key && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {song.original_key}
                            </Badge>
                          )}
                          {canEdit(setlist.library_id) && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddSong(song);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Setlist Songs */}
          <Card>
            <CardHeader>
              <CardTitle>
                Músicas do Setlist ({setlist.songs?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!setlist.songs || setlist.songs.length === 0 ? (
                <div className="text-center py-12">
                  <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma música adicionada ainda
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Clique em uma música da lista ao lado para adicionar
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto space-y-2">
                  {setlist.songs.map((song, index) => (
                    <div
                      key={song.id}
                      data-song-index={index}
                      draggable={canEdit(setlist.library_id)}
                      onDragStart={() => canEdit(setlist.library_id) && handleDragStart(index)}
                      onDragEnter={() => canEdit(setlist.library_id) && handleDragEnter(index)}
                      onDragEnd={canEdit(setlist.library_id) ? handleDragEnd : undefined}
                      onDragOver={(e) => canEdit(setlist.library_id) && e.preventDefault()}
                      onTouchStart={(e) => canEdit(setlist.library_id) && handleTouchStart(index, e.nativeEvent)}
                      onTouchMove={(e) => canEdit(setlist.library_id) && handleTouchMove(e.nativeEvent)}
                      onTouchEnd={canEdit(setlist.library_id) ? handleTouchEnd : undefined}
                      className={`flex items-center gap-3 p-4 border rounded-lg transition-all group ${
                        draggedIndex === index 
                          ? 'opacity-50 scale-95' 
                          : dragOverIndex === index 
                          ? 'border-primary bg-primary/5 scale-[1.02]' 
                          : 'hover:bg-muted/50'
                      }`}
                      style={{ cursor: canEdit(setlist.library_id) ? 'grab' : 'default' }}
                    >
                      {canEdit(setlist.library_id) && (
                        <div className="cursor-grab active:cursor-grabbing" style={{ touchAction: 'none' }}>
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/songs/${song.id}`)}
                      >
                        <h3 className="font-medium">{song.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {song.artist}
                        </p>
                      </div>
                      {song.original_key && (
                        <Badge variant="outline" className="font-mono">
                          {song.original_key}
                        </Badge>
                      )}
                      {canEdit(setlist.library_id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSong(song.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PrintOptionsDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        onPrint={handlePrintSetlist}
        isPrinting={printingPdf}
      />
    </div>
  );
};

export default SetlistManager;
