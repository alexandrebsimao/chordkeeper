import { useParams } from "react-router-dom";
import { Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/api";

type Setlist = {
  id: number;
  title: string;
  songs_count: number;
  public_token: string;
};

const PublicSetlistOptions = () => {
  const { publicToken } = useParams();
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSetlist = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public/setlist/${publicToken}`);
        if (!response.ok) {
          throw new Error("Setlist não encontrado");
        }
        const data = await response.json();
        setSetlist(data);
      } catch (error) {
        console.error("Erro ao carregar setlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSetlist();
  }, [publicToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!setlist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Setlist não encontrado
            </h1>
            <p className="text-gray-600">
              O link pode estar inválido ou expirado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <Card className="max-w-lg w-full shadow-2xl">
        <CardContent className="p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {setlist.title}
          </h1>
          <p className="text-gray-600 mb-8">
            {setlist.songs_count} {setlist.songs_count === 1 ? "música" : "músicas"}
          </p>

          <div className="flex flex-col gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.location.href = `/public/setlist/${publicToken}/play`}
            >
              <Play className="h-5 w-5 mr-2" />
              Abrir Modo Apresentação
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50"
              onClick={() => window.open(`${API_BASE_URL}/api/public/setlist/${publicToken}/pdf`, "_blank")}
            >
              <Download className="h-5 w-5 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicSetlistOptions;
