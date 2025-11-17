import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Users as UsersIcon, Infinity } from 'lucide-react';
import { fetchWithAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useUserPlan } from '@/hooks/useUserPlan';

interface Plan {
  id: number;
  name: string;
  price_cents: number;
  interval: string;
  max_songs: number | null;
  max_setlists: number | null;
  max_collaborators: number;
  features: string[];
  active: boolean;
  sort_order: number;
  formatted_price: string;
  unlimited_songs: boolean;
  unlimited_setlists: boolean;
}

export default function Plans() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: userPlan, refetch: refetchUserPlan } = useUserPlan();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetchWithAuth('/api/plans');
      const data = await response.json();
      
      // Filter only active plans and sort by sort_order
      const activePlans = data.filter((plan: Plan) => plan.active)
        .sort((a: Plan, b: Plan) => a.sort_order - b.sort_order);
      
      setPlans(activePlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os planos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    setSubscribing(planId);
    
    try {
      const response = await fetchWithAuth('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.checkout_url) {
          // Redirecionar para página de pagamento do Stripe
          window.location.href = data.checkout_url;
        } else {
          // Plano free ativado diretamente
          toast({
            title: 'Sucesso!',
            description: data.message || 'Plano ativado com sucesso',
          });
          
          // Refresh user plan data
          await refetchUserPlan();
          
          // Redirect to songs page
          setTimeout(() => navigate('/songs'), 1500);
        }
      } else {
        throw new Error(data.error || 'Failed to subscribe');
      }
    } catch (error: any) {
      console.error('Error subscribing:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar a assinatura',
        variant: 'destructive',
      });
    } finally {
      setSubscribing(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('free')) return null;
    if (name.includes('starter')) return <Zap className="h-5 w-5" />;
    if (name.includes('pro')) return <Crown className="h-5 w-5" />;
    if (name.includes('team')) return <UsersIcon className="h-5 w-5" />;
    return null;
  };

  const isCurrentPlan = (planName: string) => {
    return userPlan?.plan_name === planName;
  };

  const formatPrice = (priceCents: number, interval: string) => {
    if (priceCents === 0) return 'Grátis';
    const price = (priceCents / 100).toFixed(2);
    return `R$ ${price}/${interval === 'month' ? 'mês' : 'ano'}`;
  };

  const getFeaturesList = (plan: Plan) => {
    const features = [];
    
    // Songs limit
    if (plan.unlimited_songs) {
      features.push('Músicas ilimitadas');
    } else if (plan.max_songs) {
      features.push(`Até ${plan.max_songs} músicas`);
    }
    
    // Setlists limit
    if (plan.unlimited_setlists) {
      features.push('Setlists ilimitadas');
    } else if (plan.max_setlists) {
      features.push(`Até ${plan.max_setlists} setlists`);
    }
    
    // Collaborators
    if (plan.max_collaborators > 1) {
      features.push(`Até ${plan.max_collaborators} colaboradores`);
    }
    
    // Additional features from plan.features array
    if (plan.features && plan.features.length > 0) {
      features.push(...plan.features);
    }
    
    return features;
  };

  const getPlanBadge = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('free')) return null;
    if (name.includes('starter')) return <Badge variant="secondary">Popular</Badge>;
    if (name.includes('pro')) return <Badge className="bg-purple-600 hover:bg-purple-700">Recomendado</Badge>;
    if (name.includes('team')) return <Badge variant="default">Empresas</Badge>;
    return null;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Selecione o plano ideal para suas necessidades musicais
        </p>
        {userPlan && (
          <div className="mt-4">
            <Badge variant="outline" className="text-sm">
              Plano atual: {userPlan.plan_name}
            </Badge>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.name);
          const features = getFeaturesList(plan);
          const icon = getPlanIcon(plan.name);
          const badge = getPlanBadge(plan.name);
          const isPopular = plan.name.toLowerCase().includes('pro');

          return (
            <Card 
              key={plan.id} 
              className={`relative flex flex-col ${
                isPopular ? 'border-purple-600 border-2 shadow-lg scale-105' : ''
              } ${isCurrent ? 'border-primary border-2' : ''}`}
            >
              {badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  {badge}
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {icon && <div className="text-primary">{icon}</div>}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <div className="text-3xl font-bold mt-2">
                  {formatPrice(plan.price_cents, plan.interval)}
                </div>
                {plan.price_cents > 0 && (
                  <CardDescription className="text-xs">
                    Cobrado {plan.interval === 'month' ? 'mensalmente' : 'anualmente'}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  
                  {(plan.unlimited_songs || plan.unlimited_setlists) && (
                    <li className="flex items-start gap-2 pt-2 border-t">
                      <Infinity className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">Recursos ilimitados</span>
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                {isCurrent ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled
                  >
                    Plano Atual
                  </Button>
                ) : (
                  <Button 
                    className={`w-full ${isPopular ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id}
                  >
                    {subscribing === plan.id ? 'Processando...' : 'Selecionar Plano'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="mt-16 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Compare os Planos</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-semibold">Recurso</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center p-4 font-semibold">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-medium">Músicas</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center p-4">
                    {plan.unlimited_songs ? (
                      <Infinity className="h-5 w-5 mx-auto text-purple-600" />
                    ) : (
                      plan.max_songs || '—'
                    )}
                  </td>
                ))}
              </tr>
              
              <tr className="border-b">
                <td className="p-4 font-medium">Setlists</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center p-4">
                    {plan.unlimited_setlists ? (
                      <Infinity className="h-5 w-5 mx-auto text-purple-600" />
                    ) : (
                      plan.max_setlists || '—'
                    )}
                  </td>
                ))}
              </tr>
              
              <tr className="border-b">
                <td className="p-4 font-medium">Colaboradores</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center p-4">
                    {plan.max_collaborators}
                  </td>
                ))}
              </tr>
              
              <tr className="border-b">
                <td className="p-4 font-medium">Suporte</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="text-center p-4">
                    {plan.price_cents === 0 ? 'Email' : 'Email + Chat'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posso mudar de plano a qualquer momento?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                As mudanças são aplicadas imediatamente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">O que acontece se eu atingir o limite?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Quando você atingir o limite de músicas ou setlists do seu plano, 
                será necessário fazer upgrade para continuar adicionando conteúdo.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posso cancelar minha assinatura?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sim, você pode cancelar sua assinatura a qualquer momento. 
                Você continuará tendo acesso até o final do período pago.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
