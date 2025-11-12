import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

type Song = {
  id: number;
  title: string;
  artist?: string;
  original_key?: string;
  capo?: number;
  bpm?: number;
  content?: string;
  content_format?: string;
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
  
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar lista de músicas do setlist
  useEffect(() => {
    const fetchSetlistSongs = async () => {
      try {
        const response = await fetch(`/api/public/setlist/${publicToken}`);
        
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

  // Controle de scroll automático
  useEffect(() => {
    if (!isScrolling) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    if (!contentRef.current) {
      return;
    }

    scrollIntervalRef.current = setInterval(() => {
      if (!contentRef.current) {
        return;
      }

      contentRef.current.scrollTop += scrollSpeed;
      
      // Parar quando chegar ao final
      const isAtBottom = 
        contentRef.current.scrollHeight - contentRef.current.scrollTop <= 
        contentRef.current.clientHeight + 10;
      
      if (isAtBottom) {
        setIsScrolling(false);
      }
    }, 50);

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isScrolling, scrollSpeed]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsScrolling(false);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < songs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsScrolling(false);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };

  const toggleScroll = () => {
    setIsScrolling(!isScrolling);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 32));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header fixo */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-semibold">{currentSong?.title || 'Carregando...'}</h1>
              {currentSong?.artist && (
                <p className="text-sm text-muted-foreground">{currentSong.artist}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Contador de músicas */}
            <Badge variant="outline" className="hidden sm:inline-flex">
              {currentIndex + 1} / {songs.length}
            </Badge>

            {/* Controle de fonte */}
            <Button variant="outline" size="icon" onClick={decreaseFontSize}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-mono w-12 text-center">{fontSize}px</span>
            <Button variant="outline" size="icon" onClick={increaseFontSize}>
              <ZoomIn className="h-4 w-4" />
            </Button>

            {/* Scroll automático */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scroll-speed">
                      Velocidade do Scroll: {scrollSpeed}x
                    </Label>
                    <Slider
                      id="scroll-speed"
                      min={0.5}
                      max={5}
                      step={0.5}
                      value={[scrollSpeed]}
                      onValueChange={(value) => setScrollSpeed(value[0])}
                      className="mt-2"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant={isScrolling ? "destructive" : "default"}
              size="icon"
              onClick={toggleScroll}
            >
              {isScrolling ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Badges de informações */}
        <div className="flex items-center gap-2 px-4 pb-4">
          {currentSong?.key && (
            <Badge variant="outline" className="font-mono text-xs">
              Tom: {currentSong.key}
            </Badge>
          )}
          {currentSong?.capo !== null && currentSong?.capo !== undefined && currentSong?.capo > 0 && (
            <Badge variant="outline" className="font-mono text-xs">
              Capo: {currentSong.capo}
            </Badge>
          )}
          {currentSong?.bpm && (
            <Badge variant="outline" className="font-mono text-xs">
              BPM: {currentSong.bpm}
            </Badge>
          )}
        </div>
      </div>

      {/* Conteúdo da música */}
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
        
        .music-content {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
      `}</style>
      <div 
        ref={contentRef}
        className="music-content flex-1 overflow-y-auto p-6 pb-24 md:pb-6"
        style={{ fontSize: `${fontSize}px` }}
      >
        <Card>
          <CardContent className="p-6">
            {currentSong?.content ? (
              <div
                className="font-mono whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: currentSong.content }}
              />
            ) : (
              <p className="text-muted-foreground">Sem conteúdo disponível</p>
            )}
          </CardContent>
        </Card>
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

          <Badge variant="secondary" className="mx-4 sm:hidden">
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
