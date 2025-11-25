import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, Trash2, User, UserPlus } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LibraryShare {
  id: number;
  permission: string;
  user_email: string;
  user_name: string;
  created_at: string;
}

interface ShareLibraryDialogProps {
  libraryId: number;
  libraryName: string;
  isOwner: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const ShareLibraryDialog = ({ 
  libraryId, 
  libraryName, 
  isOwner,
  variant = "ghost",
  size = "icon"
}: ShareLibraryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState<LibraryShare[]>([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"read_only" | "editor">("read_only");
  const { toast } = useToast();

  const loadShares = async () => {
    try {
      const response = await fetchWithAuth(`/libraries/${libraryId}/shares`);
      if (response.ok) {
        const data = await response.json();
        const sharesData = data.data?.map((item: any) => ({
          id: item.id,
          ...item.attributes,
        })) || [];
        setShares(sharesData);
      }
    } catch (error) {
      console.error("Erro ao carregar compartilhamentos:", error);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      loadShares();
    }
  };

  const handleShare = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Digite o email do usuário",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`/libraries/${libraryId}/shares`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          library_share: {
            email,
            permission,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Biblioteca compartilhada com sucesso",
        });
        setEmail("");
        setPermission("read_only");
        loadShares();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.errors?.[0] || error.error || "Erro ao compartilhar biblioteca",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao compartilhar biblioteca",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (shareId: number, newPermission: string) => {
    try {
      const response = await fetchWithAuth(`/libraries/${libraryId}/shares/${shareId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          library_share: {
            permission: newPermission,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Permissão atualizada",
        });
        loadShares();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao atualizar permissão",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissão",
        variant: "destructive",
      });
    }
  };

  const handleRemoveShare = async (shareId: number) => {
    if (!confirm("Deseja realmente remover este compartilhamento?")) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/libraries/${libraryId}/shares/${shareId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Compartilhamento removido",
        });
        loadShares();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao remover compartilhamento",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover compartilhamento",
        variant: "destructive",
      });
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} title="Compartilhar biblioteca">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Biblioteca</DialogTitle>
          <DialogDescription>
            Compartilhe "{libraryName}" com outros usuários
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-4 border rounded-lg p-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do usuário</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission">Permissão</Label>
              <Select
                value={permission}
                onValueChange={(value) => setPermission(value as "read_only" | "editor")}
              >
                <SelectTrigger id="permission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read_only">Somente Leitura</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {permission === "read_only"
                  ? "Pode visualizar músicas e setlists"
                  : "Pode visualizar, criar e editar músicas e setlists"}
              </p>
            </div>

            <Button onClick={handleShare} disabled={loading} className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>

          {shares.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Compartilhamentos ativos</h4>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Permissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shares.map((share) => (
                      <TableRow key={share.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{share.user_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {share.user_email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={share.permission}
                            onValueChange={(value) => handleUpdatePermission(share.id, value)}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read_only">Somente Leitura</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveShare(share.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareLibraryDialog;
