import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const ConfirmEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  // Read status from URL parameters (backend already processed the confirmation)
  const urlStatus = searchParams.get("status");
  const urlMessage = searchParams.get("message");
  
  const status = urlStatus === "success" ? "success" : urlStatus === "error" ? "error" : "error";

  useEffect(() => {
    if (urlStatus === "success") {
      toast({
        title: "Email confirmado!",
        description: "Sua conta foi ativada com sucesso. Você já pode fazer login.",
      });
    } else if (urlStatus === "error") {
      const message = urlMessage || "Não foi possível confirmar seu email. O token pode estar expirado ou inválido.";
      setErrorMessage(message);
      toast({
        title: "Erro na confirmação",
        description: message,
        variant: "destructive",
      });
    } else {
      setErrorMessage("Link de confirmação inválido ou expirado.");
    }
  }, [urlStatus, urlMessage, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              {status === "success" && <CheckCircle className="h-10 w-10 text-green-600" />}
              {status === "error" && <XCircle className="h-10 w-10 text-red-600" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "success" && "Email Confirmado!"}
            {status === "error" && "Erro na Confirmação"}
          </CardTitle>
          <CardDescription>
            {status === "success" && "Sua conta foi ativada com sucesso!"}
            {status === "error" && errorMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === "success" && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Agora você pode fazer login com suas credenciais.
              </p>
            </div>
          )}
          
          {status === "error" && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Se você precisar de ajuda, entre em contato com o suporte.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          {status === "success" && (
            <Button
              className="w-full"
              onClick={() => navigate("/auth/login")}
            >
              Ir para o Login
            </Button>
          )}
          
          {status === "error" && (
            <>
              <Button
                className="w-full"
                onClick={() => navigate("/auth/register")}
              >
                Tentar Novamente
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/auth/login")}
              >
                Voltar ao Login
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConfirmEmail;
