import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, X, GripVertical, Music2 } from "lucide-react";
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

// Mock data
const mockSetlists = [
  {
    id: 1,
    name: "Show Acústico 2024",
    date: "2024-03-15",
    songs: [
      { id: 1, title: "Wonderwall", artist: "Oasis", key: "Em" },
    ],
  },
];

const mockAvailableCifras = [
  { id: 1, title: "Wonderwall", artist: "Oasis", key: "Em" },
  { id: 2, title: "Nothing Else Matters", artist: "Metallica", key: "Em" },
  { id: 3, title: "Tears in Heaven", artist: "Eric Clapton", key: "A" },
];

const SetlistManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const setlist = mockSetlists.find((s) => s.id === Number(id));
  const [songs, setSongs] = useState(setlist?.songs || []);

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

  const availableCifras = mockAvailableCifras.filter(
    (cifra) =>
      !songs.find((s) => s.id === cifra.id) &&
      (searchQuery === "" ||
        cifra.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cifra.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddSong = (cifra: typeof mockAvailableCifras[0]) => {
    setSongs([...songs, cifra]);
    toast({
      title: "Música adicionada",
      description: `${cifra.title} foi adicionada ao setlist.`,
    });
    setSearchQuery("");
  };

  const handleRemoveSong = (songId: number) => {
    setSongs(songs.filter((s) => s.id !== songId));
    toast({
      title: "Música removida",
      description: "Música removida do setlist.",
    });
  };

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
              <h1 className="text-3xl font-bold text-foreground">{setlist.name}</h1>
              {setlist.date && (
                <p className="text-muted-foreground">
                  {new Date(setlist.date).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>
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
                  {availableCifras.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma música encontrada
                    </p>
                  ) : (
                    availableCifras.map((cifra) => (
                      <div
                        key={cifra.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => {
                          handleAddSong(cifra);
                          setIsDialogOpen(false);
                        }}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium">{cifra.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {cifra.artist}
                          </p>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {cifra.key}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Músicas do Setlist ({songs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {songs.length === 0 ? (
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
                {songs.map((song, index) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/cifra/${song.id}`)}
                    >
                      <h3 className="font-medium">{song.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {song.artist}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {song.key}
                    </Badge>
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
