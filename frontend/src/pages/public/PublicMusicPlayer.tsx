import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/config/api";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useMusicNavigation } from "@/hooks/use-music-navigation";
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
  content_format?: string;
  attachment_url?: string;
};

type SetlistSong = {
  id: number;
  title: string;
  artist?: string;
};

const PublicMusicPlayer = () => {
  const { publicToken } = useParams();
  
  const [songs, setSongs] = useState<SetlistSong[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  
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
    const fetchSetlistSongs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/setlist/${publicToken}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar setlist');
        }

        const data = await response.json();
        const songsData = data.songs || [];
        
        setSongs(songsData);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch setlist', err);
        setLoading(false);
      }
    };

    fetchSetlistSongs();
  }, [publicToken]);

  // Carregar música atual
  useEffect(() => {
    if (songs.length === 0 || !songs[currentIndex]) return;

    const fetchSong = async () => {
      try {
        const data = songs[currentIndex]
        console.log('Current song data:', data);
        
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
        console.error('Failed to fetch song', err);
      }
    };

    fetchSong();
  }, [currentIndex, songs]);

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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-shrink-0 p-2 sm:p-3 md:p-4">
        <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
          {/* Branding */}
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground">ChordKeeper</h2>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words">{currentSong?.title || 'Carregando...'}</h1>
                {currentSong?.artist && (
                  <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
                )}
              </div>
            </div>

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
        <div className="max-w-4xl mx-auto h-full px-2 sm:px-3 md:px-4">
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

export default PublicMusicPlayer;
