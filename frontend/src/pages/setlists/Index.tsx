import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Music, Calendar, Trash2, Printer, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { fetchWithAuth, isAuthenticated } from "@/lib/auth";
import PrintOptionsDialog from "@/components/PrintOptionsDialog";
import ShareSetlistDialog from "@/components/ShareSetlistDialog";

type ApiSetlist = {
  id: number;
  title: string;
  description?: string;
  total_songs?: number;
  created_at?: string;
  updated_at?: string;
  public_link?: {
    uuid: string;
    url: string;
  };
};

const Setlists = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [setlists, setSetlists] = useState<ApiSetlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printingPdf, setPrintingPdf] = useState(false);
  const [selectedSetlistId, setSelectedSetlistId] = useState<number | null>(null);
  const [newSetlist, setNewSetlist] = useState({ title: "", description: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const perPage = 6;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handlePrintSetlist = async (setlistId: number, fontSize: number = 16) => {
    setPrintingPdf(true);
    try {
      const response = await fetchWithAuth(`/api/setlists/${setlistId}/print?font_size=${fontSize}`);

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

    let mounted = true;

    const fetchSetlists = async (pageToLoad: number) => {
      const url = `/api/setlists?page=${pageToLoad}&per_page=${perPage}`;
      try {
        if (pageToLoad === 1) setLoading(true);
        else setLoadingMore(true);

        const res = await fetchWithAuth(url);
        
        if (!res.ok) {
          if (res.status === 401) {
            navigate("/auth/login");
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        
        const jsonData = await res.json();
        
        // Parse JSONAPI format
        let data: ApiSetlist[] = [];
        if (jsonData.data && Array.isArray(jsonData.data)) {
          data = jsonData.data.map((item: any) => ({
            id: item.id,
            ...item.attributes
          }));
        }

        if (!mounted) return;

        if (pageToLoad === 1) setSetlists(data || []);
        else setSetlists((s) => [...s, ...(data || [])]);

        // if fewer items than perPage, no more pages
        if (!data || data.length < perPage) setHasMore(false);
      } catch (err: any) {
        console.error('Failed to fetch setlists', err);
        if (mounted) {
          toast({
            title: "Erro",
            description: "Erro ao carregar setlists",
            variant: "destructive",
          });
        }
        setHasMore(false);
      } finally {
        if (!mounted) return;
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchSetlists(page);

    return () => { mounted = false };
  }, [page, toast]);

  // IntersectionObserver to load more when sentinel is visible
  useEffect(() => {
    if (!sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          setPage((p) => p + 1);
        }
      });
    }, {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading]);

  const fetchSetlist = async (id: number) => {
    try {
      const response = await fetchWithAuth(`/api/setlists/${id}`);
      
      if (response.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const jsonData = await response.json();
      const updatedSetlist = {
        id: jsonData.data.id,
        ...jsonData.data.attributes
      };

      // Update setlist in state
      setSetlists((prevSetlists) =>
        prevSetlists.map((s) => (s.id === updatedSetlist.id ? updatedSetlist : s))
      );
    } catch (err: any) {
      console.error('Failed to fetch setlist', err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o setlist",
        variant: "destructive",
      });
    }
  }

  const handleCreateSetlist = async () => {
    if (!newSetlist.title) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome do setlist.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetchWithAuth("/api/setlists", {
        method: "POST",
        body: JSON.stringify({
          setlist: {
            title: newSetlist.title,
            description: newSetlist.description,
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Reset pagination and reload
      setPage(1);
      setHasMore(true);
      setSetlists([]);
      setIsDialogOpen(false);
      setNewSetlist({ title: "", description: "" });
      toast({
        title: "Sucesso!",
        description: "Setlist criado com sucesso.",
      });
    } catch (err: any) {
      console.error('Failed to create setlist', err);
      toast({
        title: "Erro",
        description: "Erro ao criar setlist",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSetlist = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este setlist?")) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/setlists/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Reset pagination and reload
      setPage(1);
      setHasMore(true);
      setSetlists([]);
      toast({
        title: "Removido",
        description: "Setlist removido com sucesso.",
      });
    } catch (err: any) {
      console.error('Failed to delete setlist', err);
      toast({
        title: "Erro",
        description: "Erro ao excluir setlist",
        variant: "destructive",
      });
    }
  };

  const filteredSetlists = setlists.filter((setlist) => {
    const term = searchTerm.toLowerCase();
    return (
      (setlist.title || '').toLowerCase().includes(term) ||
      (setlist.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 p-6 pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Setlists</h1>
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
                  <Label htmlFor="title">Nome do Setlist *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Show Acústico"
                    value={newSetlist.title}
                    onChange={(e) =>
                      setNewSetlist({ ...newSetlist, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    placeholder="Descreva este setlist"
                    value={newSetlist.description}
                    onChange={(e) =>
                      setNewSetlist({ ...newSetlist, description: e.target.value })
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

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Carregando setlists...</p>
          </div>
        ) : filteredSetlists.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            {setlists.length === 0 ? (
              <>
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
              </>
            ) : (
              <p className="text-muted-foreground">Nenhum setlist encontrado</p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSetlists.map((setlist) => (
              <Card
                key={setlist.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/setlist/${setlist.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {setlist.title}
                      </h3>
                      {setlist.description && (
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                          {setlist.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {setlist.total_songs !== undefined && (
                          <div className="flex items-center gap-1">
                            <Music className="h-4 w-4" />
                            <span>{setlist.total_songs} {setlist.total_songs === 1 ? 'música' : 'músicas'}</span>
                          </div>
                        )}
                        {setlist.created_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(setlist.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <ShareSetlistDialog
                        setlistId={setlist.id}
                        setlistTitle={setlist.title}
                        publicLink={setlist.public_link}
                        onLinkGenerated={() => fetchSetlist(setlist.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-muted"
                        onClick={() => {
                          setSelectedSetlistId(setlist.id);
                          setPrintDialogOpen(true);
                        }}
                        title="Imprimir setlist"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteSetlist(setlist.id)}
                        title="Excluir setlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* sentinel for infinite scroll */}
            <div ref={sentinelRef} />
            {loadingMore && (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Carregando mais setlists...</p>
              </div>
            )}
            {!hasMore && filteredSetlists.length > 0 && (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Fim da lista</p>
              </div>
            )}
          </div>
        )}
      </div>

      <PrintOptionsDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        onPrint={(fontSize) => selectedSetlistId && handlePrintSetlist(selectedSetlistId, fontSize)}
        isPrinting={printingPdf}
      />
    </div>
  );
};

export default Setlists;
