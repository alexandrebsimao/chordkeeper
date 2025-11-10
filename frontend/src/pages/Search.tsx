import { useState } from "react";
import { Search as SearchIcon, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const mockCifras = [
  {
    id: 1,
    title: "Wonderwall",
    artist: "Oasis",
    key: "Em",
    difficulty: "Fácil",
  },
  {
    id: 2,
    title: "Tears in Heaven",
    artist: "Eric Clapton",
    key: "A",
    difficulty: "Intermediário",
  },
  {
    id: 3,
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    key: "Am",
    difficulty: "Avançado",
  },
  {
    id: 4,
    title: "Blackbird",
    artist: "The Beatles",
    key: "G",
    difficulty: "Intermediário",
  },
  {
    id: 5,
    title: "Hotel California",
    artist: "Eagles",
    key: "Bm",
    difficulty: "Intermediário",
  },
];

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();

  const filteredCifras = mockCifras.filter((cifra) => {
    const matchesSearch =
      cifra.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cifra.artist.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter =
      activeFilter === "all" || cifra.difficulty === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Fácil":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "Intermediário":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "Avançado":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex-1 p-6 pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Buscar Cifras</h1>
          <p className="text-muted-foreground">Encontre suas músicas favoritas</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar por título ou artista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
            >
              Todas
            </Button>
            <Button
              variant={activeFilter === "Fácil" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("Fácil")}
            >
              Fácil
            </Button>
            <Button
              variant={activeFilter === "Intermediário" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("Intermediário")}
            >
              Intermediário
            </Button>
            <Button
              variant={activeFilter === "Avançado" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("Avançado")}
            >
              Avançado
            </Button>
          </div>
        </div>

        {filteredCifras.length === 0 ? (
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
                onClick={() => navigate(`/cifra/${cifra.id}`)}
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
                        Tom: {cifra.key}
                      </Badge>
                      <Badge className={getDifficultyColor(cifra.difficulty)}>
                        {cifra.difficulty}
                      </Badge>
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

export default Search;
