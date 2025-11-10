import { useEffect, useRef, useState } from "react";
import { Music, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    let mounted = true;

    const fetchSongs = async (pageToLoad: number) => {
      const url = `http://localhost:3000/api/songs?page=${pageToLoad}&per_page=${perPage}`;
      try {
        if (pageToLoad === 1) setLoading(true);
        else setLoadingMore(true);

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Minhas Cifras</h1>
          <p className="text-muted-foreground">Gerencie e acesse suas cifras favoritas</p>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar por título ou artista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Carregando músicas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredCifras.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma cifra encontrada</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCifras.map((cifra) => (
              <Card
                key={cifra.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/songs/${cifra.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {cifra.title}
                      </h3>
                      <p className="text-muted-foreground">{cifra.artist}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className="font-mono">
                        Tom: {cifra.transpose_key || cifra.original_key || '—'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
