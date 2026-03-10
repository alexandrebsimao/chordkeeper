import { useState } from "react";
import { Link } from "react-router-dom";
import { Music2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";

const ResendConfirmation = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            email,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast({
          title: "Email enviado!",
          description: "As instruções de confirmação foram enviadas para seu email.",
          duration: 5000,
        });
      } else {
        throw new Error(data.errors?.[0] || data.status?.message || "Erro ao enviar email de confirmação");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              {success ? (
                <Mail className="h-10 w-10 text-green-600" />
              ) : (
                <Music2 className="h-10 w-10 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {success ? "Email Enviado!" : "Reenviar Confirmação"}
          </CardTitle>
          <CardDescription>
            {success 
              ? "Verifique sua caixa de entrada e siga as instruções para confirmar seu email."
              : "Digite seu email para receber novamente as instruções de confirmação"
            }
          </CardDescription>
        </CardHeader>
        
        {!success ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Enviando..." : "Reenviar email de confirmação"}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <Link 
                  to="/auth/login" 
                  className="text-primary font-medium hover:underline"
                >
                  Voltar ao login
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Não recebeu o email? Verifique sua caixa de spam.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => setSuccess(false)}
            >
              Enviar novamente
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = "/auth/login"}
            >
              Ir para o Login
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ResendConfirmation;
