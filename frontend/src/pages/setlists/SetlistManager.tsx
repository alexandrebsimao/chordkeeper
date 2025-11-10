import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X, GripVertical, Music2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
};

const SetlistManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetchSetlist();
  }, [id]);

  useEffect(() => {
    if (isDialogOpen) {
      fetchAvailableSongs();
    }
  }, [isDialogOpen, searchQuery]);

  const fetchSetlist = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/setlists/${id}`, {
        credentials: "include",
      });
      
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

  const fetchAvailableSongs = async () => {
    setLoadingSongs(true);
    try {
      const url = searchQuery 
        ? `http://localhost:3000/api/songs?search=${encodeURIComponent(searchQuery)}`
        : `http://localhost:3000/api/songs`;
        
      const res = await fetch(url, {
        credentials: "include",
      });
      
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
      
      // Filter out songs already in setlist
      const filteredSongs = data.filter(
        song => !setlist?.songs.find(s => s.id === song.id)
      );
      
      setAvailableSongs(filteredSongs);
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
      const res = await fetch(`http://localhost:3000/api/setlists/${id}/add_song`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ song_id: song.id }),
      });

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
      const res = await fetch(`http://localhost:3000/api/setlists/${id}/remove_song`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ song_id: songId }),
      });

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
      const res = await fetch(`http://localhost:3000/api/setlists/${id}/reorder_songs`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          song_ids: newSongs.map(song => song.id)
        }),
      });

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
      <div className="max-w-4xl mx-auto space-y-6">
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(`http://localhost:3000/api/setlists/${id}/print`, '_blank')}
              title="Imprimir setlist"
            >
              <Printer className="h-5 w-5" />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Música
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Música ao Setlist</DialogTitle>
                <DialogDescription>
                  Selecione uma música da sua biblioteca
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Buscar por título ou artista..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {loadingSongs ? (
                    <p className="text-center text-muted-foreground py-8">
                      Carregando músicas...
                    </p>
                  ) : availableSongs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma música encontrada
                    </p>
                  ) : (
                    availableSongs.map((song) => (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => {
                          handleAddSong(song);
                          setIsDialogOpen(false);
                        }}
                      >
                        <div className="flex-1">
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
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

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
                <p className="text-muted-foreground mb-4">
                  Nenhuma música adicionada ainda
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeira Música
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {setlist.songs.map((song, index) => (
                  <div
                    key={song.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`flex items-center gap-3 p-4 border rounded-lg transition-all group ${
                      draggedIndex === index 
                        ? 'opacity-50 scale-95' 
                        : dragOverIndex === index 
                        ? 'border-primary bg-primary/5 scale-[1.02]' 
                        : 'hover:bg-muted/50'
                    }`}
                    style={{ cursor: 'grab' }}
                  >
                    <div className="cursor-grab active:cursor-grabbing" style={{ touchAction: 'none' }}>
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSong(song.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetlistManager;
