import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/lib/auth";
import { useLibraries } from "@/hooks/use-libraries";
import { usePermissions } from "@/hooks/use-permissions";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PageHeader } from "@/components/PageHeader";
import { SearchInput } from "@/components/SearchInput";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ResourceCard } from "@/components/ResourceCard";

type ApiSong = {
  id: number;
  title: string;
  artist?: string;
  original_key?: string | null;
  transpose_key?: string | null;
};

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [songs, setSongs] = useState<ApiSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { libraries } = useLibraries();
  const { canEdit } = usePermissions();
  useRequireAuth();

  useEffect(() => {
    let mounted = true;

    const fetchSongs = async (pageToLoad: number) => {
      const url = `/api/songs?page=${pageToLoad}&per_page=${perPage}`;
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

        // Parse JSONAPI format: extract data array from response
        let data: ApiSong[] = [];
        if (jsonData.data && Array.isArray(jsonData.data)) {
          data = jsonData.data.map((item: any) => ({
            id: item.id,
            ...item.attributes
          }));
        } else if (Array.isArray(jsonData)) {
          data = jsonData;
        }

        if (!mounted) return;

        if (pageToLoad === 1) setSongs(data || []);
        else setSongs((s) => [...s, ...(data || [])]);

        // if fewer items than perPage, no more pages
        if (!data || data.length < perPage) setHasMore(false);
      } catch (err: any) {
        console.error('Failed to fetch songs', err);
        if (mounted) setError(err.message || 'Erro ao carregar músicas');
        setHasMore(false);
      } finally {
        if (!mounted) return;
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchSongs(page);

    return () => { mounted = false };
  }, [page]);

  // reset pagination when searchTerm cleared (optional)
  useEffect(() => {
    if (searchTerm === '') return;
    // Note: for server-side search you'd reset page and refetch with query param
  }, [searchTerm]);

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

  const filteredCifras = songs.filter((cifra) => {
    const term = searchTerm.toLowerCase();
    return (
      (cifra.title || '').toLowerCase().includes(term) ||
      (cifra.artist || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 p-6 pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Minhas Cifras"
          description="Gerencie e acesse suas cifras favoritas"
          action={canEdit() && (
            <Button onClick={() => navigate("/songs/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Cifra
            </Button>
          )}
        />

        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por título ou artista..."
        />

        {loading ? (
          <LoadingState message="Carregando músicas..." />
        ) : error ? (
          <ErrorState error={error} />
        ) : filteredCifras.length === 0 ? (
          <EmptyState
            title="Nenhuma cifra encontrada"
            description={searchTerm ? "Tente buscar com outros termos" : "Adicione sua primeira cifra"}
          />
        ) : (
          <div className="grid gap-4">
            {filteredCifras.map((cifra) => (
              <ResourceCard
                key={cifra.id}
                title={cifra.title}
                subtitle={cifra.artist}
                badges={[
                  { label: `Tom: ${cifra.transpose_key || cifra.original_key || '—'}`, variant: "outline", className: "font-mono" },
                  { label: `Capo: ${cifra.capo ? `${cifra.capo}ª casa` : '—'}`, variant: "outline", className: "font-mono" }
                ]}
                onClick={() => navigate(`/songs/${cifra.id}`)}
              />
            ))}
            {/* sentinel for infinite scroll */}
            <div ref={sentinelRef} />
            {loadingMore && (
              <div className="text-center py-6 col-span-full">
                <p className="text-muted-foreground">Carregando mais músicas...</p>
              </div>
            )}
            {!hasMore && (
              <div className="text-center py-6 col-span-full">
                <p className="text-muted-foreground">Fim da lista</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
