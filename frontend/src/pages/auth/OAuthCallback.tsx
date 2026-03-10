import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // ✅ SEGURANÇA: Backend agora usa cookies HttpOnly - não recebemos mais token na URL
    const success = searchParams.get("success");
    const email = searchParams.get("email");
    const error = searchParams.get("error");

    if (error) {
      toast({
        title: "Erro no login com Google",
        description: decodeURIComponent(error),
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // ✅ Token está em cookie HttpOnly - apenas verificar se login foi bem sucedido
    if (success === "true" && email) {
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${email}`,
      });

      navigate("/songs");
    } else {
      toast({
        title: "Erro no login",
        description: "Falha na autenticação com Google",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Finalizando login com Google...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
