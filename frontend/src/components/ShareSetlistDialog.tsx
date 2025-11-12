import { useState, useEffect } from "react";
import { Share2, Copy, QrCode, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

type ShareSetlistDialogProps = {
  setlistId: number;
  setlistTitle: string;
  publicLink?: {
    uuid: string;
    url: string;
  };
  onLinkGenerated?: () => void;
  variant?: "ghost" | "outline" | "default";
  iconSize?: "sm" | "md";
};

const ShareSetlistDialog = ({ 
  setlistId, 
  setlistTitle, 
  publicLink,
  onLinkGenerated,
  variant = "ghost",
  iconSize = "sm"
}: ShareSetlistDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState(publicLink);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    setLink(publicLink);
  }, [publicLink]);

  const generateLink = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/setlists/${setlistId}/public_link_generator`, {
        method: "POST",
      });

      if (response.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Erro ao gerar link");
      }

      const data = await response.json();
      setLink(data);
      
      toast({
        title: "Link gerado!",
        description: "Link público criado com sucesso.",
      });

      if (onLinkGenerated) {
        onLinkGenerated();
      }
    } catch (err: any) {
      console.error("Failed to generate link", err);
      toast({
        title: "Erro",
        description: "Erro ao gerar link público",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteLink = async () => {
    if (!confirm("Tem certeza que deseja remover o link público?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/setlists/${setlistId}/public_link_destroyer`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        navigate("/auth/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Erro ao remover link");
      }

      setLink(undefined);
      setShowQR(false);
      
      toast({
        title: "Link removido",
        description: "Link público removido com sucesso.",
      });

      if (onLinkGenerated) {
        onLinkGenerated();
      }
    } catch (err: any) {
      console.error("Failed to delete link", err);
      toast({
        title: "Erro",
        description: "Erro ao remover link público",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (link?.url) {
      navigator.clipboard.writeText(link.url);
      toast({
        title: "Copiado!",
        description: "Link copiado para a área de transferência.",
      });
    }
  };

  const generateQRCode = () => {
    setShowQR(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={variant === "ghost" ? "h-9 w-9 hover:bg-muted" : ""}
          title="Compartilhar setlist"
        >
          <Share2 className={iconSize === "sm" ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Setlist</DialogTitle>
          <DialogDescription>
            Compartilhe "{setlistTitle}" via link público ou QR code
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!link ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Nenhum link público gerado ainda
              </p>
              <Button onClick={generateLink} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Gerar Link Público
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link Público</label>
                <div className="flex gap-2">
                  <Input
                    value={link.url}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    title="Copiar link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={generateQRCode}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  {showQR ? "QR Code Gerado" : "Gerar QR Code"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteLink}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover Link
                    </>
                  )}
                </Button>
              </div>

              {showQR && link.url && (
                <div className="border rounded-lg p-4 bg-white flex flex-col items-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Escaneie o QR Code para acessar o setlist
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link.url)}`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    UUID: {link.uuid}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareSetlistDialog;
