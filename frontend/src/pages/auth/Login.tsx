import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Music2, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUnconfirmedAlert, setShowUnconfirmedAlert] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");

  // Check for OAuth error in URL
  const oauthError = searchParams.get("error");
  if (oauthError) {
    toast({
      title: "Erro no login com Google",
      description: decodeURIComponent(oauthError),
      variant: "destructive",
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/sign_in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: {
            email,
            password,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Check if user needs to confirm email
        if (data.unconfirmed) {
          setShowUnconfirmedAlert(true);
          setUnconfirmedEmail(email);
          toast({
            title: "Email não confirmado",
            description: data.error || "Você precisa confirmar seu email antes de fazer login. Verifique sua caixa de entrada.",
            variant: "destructive",
            duration: 7000,
          });
          throw new Error(data.error);
        }
        
        throw new Error(data.error || "Login falhou");
      }

      const data = await response.json();
      
      // Extrair tokens da resposta
      const accessToken = (data.access_token || data.token || 
                          response.headers.get("authorization") || 
                          response.headers.get("Authorization"))?.replace("Bearer ", "");
      const refreshToken = data.refresh_token;
      
      if (accessToken) {
        localStorage.setItem("authToken", accessToken);
      }
      
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
      });

      navigate("/songs");
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Email ou senha inválidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Rails OAuth endpoint
    window.location.href = `${API_BASE_URL}/users/auth/google_oauth2`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Music2 className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Chord Keeper</CardTitle>
          <CardDescription>
            Entre com sua conta para acessar suas músicas
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {showUnconfirmedAlert && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Email não confirmado</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>Você precisa confirmar seu email antes de fazer login.</p>
                  <p className="text-sm">Uma mensagem de confirmação foi enviada para <strong>{unconfirmedEmail}</strong>.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => navigate('/auth/resend-confirmation')}
                    type="button"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Reenviar email de confirmação
                  </Button>
                </AlertDescription>
              </Alert>
            )}
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
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link 
                to="/auth/forgot-password" 
                className="text-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
              <Link 
                to="/auth/resend-confirmation" 
                className="text-primary hover:underline"
              >
                Reenviar confirmação
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link 
                to="/auth/register" 
                className="text-primary font-medium hover:underline"
              >
                Criar conta
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
