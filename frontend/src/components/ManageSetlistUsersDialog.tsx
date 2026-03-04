import { useState, useEffect } from "react";
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
import { Users, Trash2, User, Edit2, UserPlus, Shield } from "lucide-react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SetlistShare {
  id: number;
  permission: string;
  user_email: string;
  user_name: string;
  created_at: string;
}

interface ManageSetlistUsersDialogProps {
  setlistId: number;
  setlistTitle: string;
  isOwner: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const ManageSetlistUsersDialog = ({
  setlistId,
  setlistTitle,
  isOwner,
  variant = "ghost",
  size = "icon",
}: ManageSetlistUsersDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState<SetlistShare[]>([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"read_only" | "editor">("read_only");
  const [editingShare, setEditingShare] = useState<SetlistShare | null>(null);
  const [deletingShare, setDeletingShare] = useState<SetlistShare | null>(null);
  const { toast } = useToast();

  const loadShares = async () => {
    try {
      const response = await fetchWithAuth(`/api/setlists/${setlistId}/users`);
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Shares data:', data);
        const sharesData =
          data.data?.map((item: any) => ({
            id: item.id,
            ...item.attributes,
          })) || [];
        console.log('Parsed shares:', sharesData);
        setShares(sharesData);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
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

  const handleAddUser = async () => {
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
      const response = await fetchWithAuth(`/api/setlists/${setlistId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          setlist_user: {
            email,
            permission,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Usuário adicionado ao setlist",
        });
        setEmail("");
        setPermission("read_only");
        loadShares();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.errors?.[0] || error.error || "Erro ao adicionar usuário",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (share: SetlistShare, newPermission: string) => {
    try {
      const response = await fetchWithAuth(`/api/setlists/${setlistId}/users/${share.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          setlist_user: {
            permission: newPermission,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Permissão de ${share.user_name} atualizada para ${
            newPermission === "editor" ? "Editor" : "Somente Leitura"
          }`,
        });
        setEditingShare(null);
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

  const handleRemoveUser = async () => {
    if (!deletingShare) return;

    try {
      const response = await fetchWithAuth(
        `/api/setlists/${setlistId}/users/${deletingShare.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `${deletingShare.user_name} removido do setlist`,
        });
        setDeletingShare(null);
        loadShares();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao remover usuário",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover usuário",
        variant: "destructive",
      });
    }
  };

  const getPermissionBadge = (permission: string) => {
    if (permission === "editor") {
      return (
        <Badge variant="default" className="gap-1">
          <Edit2 className="h-3 w-3" />
          Editar
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Shield className="h-3 w-3" />
        Visualizar
      </Badge>
    );
  };

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size} title="Gerenciar compartilhamento">
            <Users className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Compartilhamento
            </DialogTitle>
            <DialogDescription>
              Gerencie o acesso ao setlist "{setlistTitle}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Adicionar Usuário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Adicionar Usuário
                </CardTitle>
                <CardDescription>
                  Compartilhe este setlist com outros usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                    <Label htmlFor="permission">Nível de Permissão</Label>
                    <Select
                      value={permission}
                      onValueChange={(value) => setPermission(value as "read_only" | "editor")}
                    >
                      <SelectTrigger id="permission">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read_only">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>Apenas Visualizar</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Edit2 className="h-4 w-4" />
                            <span>Editar</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {permission === "read_only"
                        ? "Pode visualizar e imprimir"
                        : "Pode visualizar, imprimir e editar as músicas"}
                    </p>
                  </div>
                </div>

                <Button onClick={handleAddUser} disabled={loading} className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Usuários */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuários com Acesso ({shares.length})
                </CardTitle>
                <CardDescription>
                  Gerencie as permissões dos usuários existentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {shares.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhum usuário compartilhado</p>
                    <p className="text-sm">Adicione usuários acima para começar</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
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
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{share.user_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {share.user_email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {editingShare?.id === share.id ? (
                                <div className="flex items-center gap-2">
                                  <Select
                                    defaultValue={share.permission}
                                    onValueChange={(value) =>
                                      handleUpdatePermission(share, value)
                                    }
                                  >
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="read_only">
                                        Apenas Visualizar
                                      </SelectItem>
                                      <SelectItem value="editor">Editar</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingShare(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                getPermissionBadge(share.permission)
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingShare(share)}
                                  disabled={editingShare?.id === share.id}
                                  title="Editar permissão"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingShare(share)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Remover usuário"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Remoção */}
      <AlertDialog
        open={!!deletingShare}
        onOpenChange={(open) => !open && setDeletingShare(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deletingShare?.user_name}</strong>{" "}
              do setlist "{setlistTitle}"?
              <br />
              <br />
              Este usuário perderá acesso imediatamente a este setlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover Usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageSetlistUsersDialog;
