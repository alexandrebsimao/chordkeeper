import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth, isAuthenticated } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useMusicNavigation } from "@/hooks/use-music-navigation";
import ShareSetlistDialog from "@/components/ShareSetlistDialog";
import MusicPlayerControls from "@/components/MusicPlayerControls";
import MusicContent from "@/components/MusicContent";
import SongInfoBadges from "@/components/SongInfoBadges";

type Song = {
  id: number;
  title: string;
  artist?: string;
  original_key?: string;
  capo?: number;
  bpm?: number;
  content?: string;
  formatted_content?: string;
  attachment_url?: string;
};

type SetlistSong = {
  id: number;
  title: string;
  position: number;
};

const MusicPlayer = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [songs, setSongs] = useState<SetlistSong[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [setlistTitle, setSetlistTitle] = useState("");
  const [publicLink, setPublicLink] = useState<{uuid: string; url: string} | undefined>(undefined);
  
  // Callback estável para quando o scroll completar
  const handleScrollComplete = useCallback(() => {
    setIsScrolling(false);
  }, []);

  // Hook para gerenciar scroll automático
  const { contentRef, setContentRef } = useAutoScroll({
    isScrolling,
    scrollSpeed,
    currentSong,
    onScrollComplete: handleScrollComplete,
  });

  // Carregar lista de músicas do setlist
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/auth/login");
      return;
    }

    const fetchSetlistSongs = async () => {
      try {
        const response = await fetchWithAuth(`/api/setlists/${id}`);
        
        if (response.status === 401) {
          navigate("/auth/login");
          return;
        }

        if (!response.ok) {
          throw new Error('Erro ao carregar setlist');
        }

        const data = await response.json();
        
        // Processar o JSON corretamente
        let songsData = [];
        if (data.data && data.data.attributes) {
          // Tentar pegar songs ou all_songs
          songsData = data.data.attributes.songs || data.data.attributes.all_songs || [];
          // Pegar título e link público
          setSetlistTitle(data.data.attributes.title || "");
          setPublicLink(data.data.attributes.public_link);
        } else if (data.attributes) {
          songsData = data.attributes.songs || data.attributes.all_songs || [];
          setSetlistTitle(data.attributes.title || "");
          setPublicLink(data.attributes.public_link);
        } else if (Array.isArray(data.data)) {
          songsData = data.data;
        } else if (Array.isArray(data)) {
          songsData = data;
        }
        
        setSongs(songsData);
        
        // Verificar se há um songId na query string
        const songIdParam = searchParams.get('songId');
        if (songIdParam) {
          const index = songsData.findIndex((s: SetlistSong) => s.id === parseInt(songIdParam));
          if (index >= 0) {
            setCurrentIndex(index);
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        toast({
          title: "Erro",
          description: "Erro ao carregar setlist",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchSetlistSongs();
  }, [id, navigate, toast, searchParams]);

  // Carregar música atual
  useEffect(() => {
    if (songs.length === 0 || !songs[currentIndex]) return;

    const fetchSong = async () => {
      try {
        const data = songs[currentIndex]
        
        // Processar o JSON corretamente
        let songData: Song;
        if (data.data && data.data.attributes) {
          songData = {
            id: data.data.id,
            ...data.data.attributes
          };
        } else if (data.id) {
          songData = data;
        } else {
          throw new Error('Formato de resposta inválido');
        }
        
        setCurrentSong(songData);
      } catch (err: any) {
        toast({
          title: "Erro",
          description: "Erro ao carregar música",
          variant: "destructive",
        });
      }
    };

    fetchSong();
  }, [currentIndex, songs, navigate, toast]);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 32));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsScrolling(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < songs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsScrolling(false);
    }
  };

  const toggleScroll = () => {
    setIsScrolling(!isScrolling);
  };

  // Hook para navegação por teclado
  useMusicNavigation({
    currentIndex,
    songsLength: songs.length,
    contentRef,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onToggleScroll: toggleScroll,
    onIncreaseFontSize: increaseFontSize,
    onDecreaseFontSize: decreaseFontSize,
  });

  const handleLinkGenerated = async () => {
    // Recarregar dados do setlist para pegar o novo link
    try {
      const response = await fetchWithAuth(`/api/setlists/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.attributes) {
          setPublicLink(data.data.attributes.public_link);
        }
      }
    } catch (err) {
      console.error('Erro ao recarregar link:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Nenhuma música no setlist</p>
          <Button onClick={() => navigate(`/setlist/${id}`)} className="mt-4">
            Voltar ao Setlist
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-shrink-0 p-3 sm:p-4 md:p-6 pb-0">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/setlist/${id}`)}
              className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground break-words">{currentSong?.title || 'Carregando...'}</h1>
              {currentSong?.artist && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{currentSong.artist}</p>
              )}
            </div>
          </div>

          <ShareSetlistDialog
            setlistId={Number(id)}
            setlistTitle={setlistTitle}
            publicLink={publicLink}
            onLinkGenerated={handleLinkGenerated}
            variant="outline"
            iconSize="md"
          />

          <MusicPlayerControls
            isScrolling={isScrolling}
            scrollSpeed={scrollSpeed}
            fontSize={fontSize}
            onToggleScroll={toggleScroll}
            onScrollSpeedChange={setScrollSpeed}
            onIncreaseFontSize={increaseFontSize}
            onDecreaseFontSize={decreaseFontSize}
          />
        </div>

        {/* Badges de informações */}
        <SongInfoBadges
          song={currentSong}
          currentIndex={currentIndex}
          totalSongs={songs.length}
        />
      </div>
    </div>

      {/* Conteúdo da música - área com scroll */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full px-3 sm:px-4 md:px-6">
          <Card className="overflow-hidden h-full">
            <CardContent className="p-3 sm:p-4 md:p-8 h-full overflow-hidden">
              <MusicContent
                song={currentSong}
                fontSize={fontSize}
                isScrolling={isScrolling}
                scrollSpeed={scrollSpeed}
                contentRef={setContentRef}
                onScrollComplete={handleScrollComplete}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer com navegação fixo */}
      <div className="md:sticky fixed bottom-0 left-0 right-0 border-t bg-background backdrop-blur supports-[backdrop-filter]:bg-background/60 z-[100]">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 max-w-[200px]"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <Badge variant="secondary" className="mx-4 sm">
            {currentIndex + 1} / {songs.length}
          </Badge>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === songs.length - 1}
            className="flex-1 max-w-[200px]"
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
