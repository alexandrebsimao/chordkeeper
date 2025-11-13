import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
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
import { fetchWithAuth, isAuthenticated } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import ShareSetlistDialog from "@/components/ShareSetlistDialog";

type Song = {
  id: number;
  title: string;
  artist?: string;
  original_key?: string;
  capo?: number;
  bpm?: number;
  content?: string;
  formatted_content?: string;
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
  
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Controle de scroll automático
  useEffect(() => {
    console.log('Scroll effect triggered - isScrolling:', isScrolling, 'scrollSpeed:', scrollSpeed);
    
    if (!isScrolling) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    if (!contentRef.current) {
      console.log('contentRef.current is null');
      return;
    }

    console.log('Starting auto-scroll');

    scrollIntervalRef.current = setInterval(() => {
      if (!contentRef.current) {
        console.log('contentRef lost');
        return;
      }

      const oldScrollTop = contentRef.current.scrollTop;
      contentRef.current.scrollTop += scrollSpeed;
      const newScrollTop = contentRef.current.scrollTop;
      
      console.log('Scrolling - oldTop:', oldScrollTop, 'newTop:', newScrollTop, 'speed:', scrollSpeed);
      
      // Parar quando chegar ao final
      const isAtBottom = 
        contentRef.current.scrollHeight - contentRef.current.scrollTop <= 
        contentRef.current.clientHeight + 10;
      
      if (isAtBottom) {
        console.log('Reached bottom, stopping');
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
    console.log('Toggle scroll:', !isScrolling);
    console.log('contentRef.current:', contentRef.current);
    setIsScrolling(!isScrolling);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 32));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

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
    <div className="flex-1 p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
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

          <Button variant="outline" size="icon" onClick={decreaseFontSize} className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10">
            <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={increaseFontSize} className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10">
            <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
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
            className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
          >
            {isScrolling ? (
              <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Play className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>

        {/* Badges de informações */}
        <div className="flex gap-3 flex-wrap items-center">
          <Badge variant="outline" className="font-mono text-xs">
            {currentIndex + 1} / {songs.length}
          </Badge>
          {currentSong?.original_key && (
            <Badge variant="outline" className="font-mono text-xs">
              Tom: {currentSong.key}
            </Badge>
          )}
          {currentSong?.capo !== null && currentSong?.capo !== undefined && currentSong?.capo > 0 && (
            <Badge variant="outline" className="font-mono text-xs">
              Capotraste: {currentSong.capo ? `${currentSong.capo}ª casa` : '—'}
            </Badge>
          )}
          {currentSong?.bpm && (
            <Badge variant="outline" className="font-mono text-xs">
              BPM: {currentSong.bpm}
            </Badge>
          )}
        </div>

        {/* Conteúdo da música */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 md:p-8">
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
                max-height: calc(100vh - 280px);
                min-height: 500px;
              }
            `}</style>
            <div 
              ref={contentRef}
              className="music-content cifra-content font-mono text-xs sm:text-sm md:text-base whitespace-pre-wrap leading-relaxed overflow-x-auto overflow-y-auto"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: currentSong?.content_format || currentSong?.content || 'Sem conteúdo disponível.' }}
            />
          </CardContent>
        </Card>

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
    </div>
  );
};

export default MusicPlayer;
