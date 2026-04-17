import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { billingService, Plan, Subscription } from "@/services/api/billing";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PlanComparison } from "@/components/billing/PlanComparison";

const formatBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { currentUser, loading: loadingUser } = useCurrentUser();
  const { toast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; message: string; read_at?: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cardToken, setCardToken] = useState("");
  const [cardBrand, setCardBrand] = useState("visa");
  const [cardLast4, setCardLast4] = useState("4242");

  const activePlans = useMemo(() => plans.filter((plan) => plan.active), [plans]);

  const loadData = async () => {
    try {
      const [plansData, subscriptionData, notificationsData] = await Promise.all([
        billingService.listPlans(),
        billingService.getMySubscription(),
        billingService.listNotifications(),
      ]);

      setPlans(plansData);
      setSubscription(subscriptionData);
      setNotifications(notificationsData);

      if (subscriptionData?.plan?.id) {
        setSelectedPlanId(subscriptionData.plan.id);
      } else if (plansData.length > 0) {
        setSelectedPlanId(plansData[0].id);
      }
    } catch {
      toast({ title: "Erro", description: "Não foi possível carregar assinaturas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingUser && !currentUser) {
      navigate("/auth/login");
      return;
    }

    if (currentUser) {
      setCustomerName(currentUser.name || "");
      loadData();
    }
  }, [loadingUser, currentUser]);

  const handleSubscribe = async () => {
    if (!selectedPlanId) return;

    setActionLoading(true);
    try {
      const response = await billingService.subscribe({
        plan_id: selectedPlanId,
        customer: { name: customerName, document: customerDocument, phone: customerPhone },
        payment: { token: cardToken || "manual_token", brand: cardBrand, last4: cardLast4 },
      });

      setSubscription(response);
      toast({ title: "Assinatura criada", description: "Seu plano foi ativado com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao assinar", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlanId) return;

    setActionLoading(true);
    try {
      const response = await billingService.changePlan(selectedPlanId);
      setSubscription(response);
      toast({ title: "Plano alterado", description: "Seu plano foi atualizado." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao alterar plano", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    setActionLoading(true);
    try {
      const response = await billingService.updatePayment({ token: cardToken || "manual_token", brand: cardBrand, last4: cardLast4 });
      setSubscription(response);
      toast({ title: "Pagamento atualizado", description: "Forma de pagamento atualizada com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao atualizar pagamento", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const response = await billingService.cancel();
      setSubscription(response);
      toast({ title: "Assinatura cancelada", description: "Sua assinatura foi cancelada." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao cancelar", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    setActionLoading(true);
    try {
      const response = await billingService.renew();
      setSubscription(response);
      toast({ title: "Assinatura renovada", description: "Renovação concluída com sucesso." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao renovar", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || loadingUser) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground">Escolha seu plano e gerencie cobrança, renovação e cancelamento.</p>
      </div>

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Plano atual</CardTitle>
            <CardDescription>Detalhes da sua assinatura ativa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <strong>{subscription.plan.name}</strong>
              <Badge>{subscription.status}</Badge>
            </div>
            <div>Expira em: {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}</div>
            <div>
              Cartão: {subscription.payment_method.brand || "-"} final {subscription.payment_method.last4 || "----"}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleRenew} disabled={actionLoading}>Renovar</Button>
              <Button variant="outline" onClick={handleCancel} disabled={actionLoading}>Cancelar plano</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Comparison Section */}
      <PlanComparison
        plans={activePlans}
        selectedPlanId={selectedPlanId}
        onSelectPlan={setSelectedPlanId}
        currentPlanId={subscription?.plan?.id}
        loading={actionLoading}
      />

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais e de pagamento</CardTitle>
          <CardDescription>Use estes dados para assinar ou atualizar cobrança.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div>
              <Label>Documento</Label>
              <Input value={customerDocument} onChange={(e) => setCustomerDocument(e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Token do cartão</Label>
              <Input value={cardToken} onChange={(e) => setCardToken(e.target.value)} placeholder="tok_xxx" />
            </div>
            <div>
              <Label>Bandeira</Label>
              <Input value={cardBrand} onChange={(e) => setCardBrand(e.target.value)} />
            </div>
            <div>
              <Label>Últimos 4 dígitos</Label>
              <Input value={cardLast4} onChange={(e) => setCardLast4(e.target.value)} maxLength={4} />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {!subscription && <Button onClick={handleSubscribe} disabled={actionLoading || !selectedPlanId}>Assinar plano</Button>}
            {subscription && <Button onClick={handleChangePlan} disabled={actionLoading || !selectedPlanId}>Trocar plano</Button>}
            {subscription && <Button variant="outline" onClick={handleUpdatePayment} disabled={actionLoading}>Atualizar pagamento</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Lembretes de vencimento e renovação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 && <div className="text-muted-foreground text-sm">Nenhuma notificação.</div>}
          {notifications.map((notification) => (
            <div key={notification.id} className="border rounded-md p-3">
              <div className="flex items-center justify-between">
                <strong>{notification.title}</strong>
                {!notification.read_at && (
                  <Button size="sm" variant="outline" onClick={async () => {
                    await billingService.markNotificationRead(notification.id);
                    setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
                  }}>
                    Marcar como lida
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPage;
