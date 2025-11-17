import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { fetchWithAuth } from '@/lib/auth';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setStatus('error');
      setMessage('ID de sessão não encontrado');
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await fetchWithAuth(`/api/checkout/success?session_id=${sessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        setStatus('success');
        setMessage(data.message || 'Pagamento confirmado!');
      } else {
        setStatus('error');
        setMessage('Não foi possível verificar o pagamento');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('error');
      setMessage('Erro ao verificar pagamento');
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
          <h2 className="text-2xl font-semibold">Verificando pagamento...</h2>
          <p className="text-muted-foreground">Aguarde enquanto confirmamos sua assinatura</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-lg mx-auto border-red-200">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-100 p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Erro no Pagamento</CardTitle>
            <CardDescription className="text-center text-base">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Houve um problema ao processar seu pagamento. Por favor, tente novamente ou entre em contato com o suporte.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/plans')} 
                variant="outline"
                className="flex-1"
              >
                Voltar para Planos
              </Button>
              <Button 
                onClick={() => navigate('/songs')} 
                className="flex-1"
              >
                Ir para Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-lg mx-auto border-green-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-4 animate-bounce">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-center text-3xl">Pagamento Confirmado!</CardTitle>
          <CardDescription className="text-center text-lg">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-lg text-center">🎉 Bem-vindo ao seu novo plano!</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Acesso imediato a todos os recursos</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Limites expandidos aplicados</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Renovação automática configurada</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/songs')} 
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              size="lg"
            >
              Começar a Usar Agora
            </Button>
            <Button 
              onClick={() => navigate('/plans')} 
              variant="ghost"
              className="w-full"
            >
              Ver Detalhes do Plano
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Um email de confirmação foi enviado para você com todos os detalhes da sua assinatura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
