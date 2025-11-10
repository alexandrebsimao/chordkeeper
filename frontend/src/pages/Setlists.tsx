import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Music, Calendar, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockSetlists = [
  {
    id: 1,
    name: "Show Acústico 2024",
    date: "2024-03-15",
    songs: 12,
  },
  {
    id: 2,
    name: "Igreja Domingo",
    date: "2024-03-20",
    songs: 8,
  },
];

const Setlists = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [setlists, setSetlists] = useState(mockSetlists);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSetlist, setNewSetlist] = useState({ name: "", date: "" });

  const handleCreateSetlist = () => {
    if (!newSetlist.name) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome do setlist.",
        variant: "destructive",
      });
      return;
    }

    const id = Math.max(...setlists.map((s) => s.id), 0) + 1;
    setSetlists([...setlists, { ...newSetlist, id, songs: 0 }]);
    setIsDialogOpen(false);
    setNewSetlist({ name: "", date: "" });
    toast({
      title: "Sucesso!",
      description: "Setlist criado com sucesso.",
    });
  };

  const handleDeleteSetlist = (id: number) => {
    setSetlists(setlists.filter((s) => s.id !== id));
    toast({
      title: "Removido",
      description: "Setlist removido com sucesso.",
    });
  };

  return (
    <div className="flex-1 p-6 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Setlists</h1>
            <p className="text-muted-foreground">Gerencie suas listas de músicas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Setlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Setlist</DialogTitle>
                <DialogDescription>
                  Crie um novo setlist para organizar suas músicas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Setlist *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Show Acústico"
                    value={newSetlist.name}
                    onChange={(e) =>
                      setNewSetlist({ ...newSetlist, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data (opcional)</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newSetlist.date}
                    onChange={(e) =>
                      setNewSetlist({ ...newSetlist, date: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleCreateSetlist} className="w-full">
                  Criar Setlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {setlists.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12">
              <Music className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-center mb-2">
                Nenhum setlist criado ainda
              </p>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Crie seu primeiro setlist para organizar suas músicas
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Setlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {setlists.map((setlist) => (
              <Card
                key={setlist.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/setlist/${setlist.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{setlist.name}</span>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteSetlist(setlist.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {setlist.date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(setlist.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Music className="h-4 w-4" />
                      <span>{setlist.songs} música{setlist.songs !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Setlists;
