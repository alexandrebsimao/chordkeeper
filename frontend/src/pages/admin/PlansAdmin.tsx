import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  duration_days: number;
  interval: string;
  active: boolean;
  sort_order?: number;
  features: string[];
  subscribers_count?: number;
  subscribers?: Array<{
    id: number;
    user_id: number;
    name: string;
    email: string;
    started_at: string;
    expires_at: string;
    status: string;
  }>;
}

const emptyPlan = {
  name: "",
  description: "",
  price_cents: 0,
  duration_days: 30,
  interval: "month",
  active: true,
  sort_order: 0,
};

const PlansAdmin = () => {
  const navigate = useNavigate();
  const { currentUser, loading: loadingUser } = useCurrentUser();
  const { toast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<Plan | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyPlan);
  const [featuresText, setFeaturesText] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    try {
      const response = await fetchWithAuth("/api/admin/plans");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      const data = result.data ? (Array.isArray(result.data) ? result.data : [result.data]) : [];
      setPlans(data);

      if (data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(data[0].id);
        const planResponse = await fetchWithAuth(`/api/admin/plans/${data[0].id}`);
        if (!planResponse.ok) throw new Error(`HTTP ${planResponse.status}`);
        
        const planResult = await planResponse.json();
        const plan = planResult.data || planResult;
        setSelectedPlanDetails(plan);
        setForm(plan);
        setFeaturesText((plan.features || []).join(", "));
      }
    } catch (error: any) {
      console.error("Error loading plans:", error);
      toast({ title: "Erro", description: "Falha ao carregar planos", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!loadingUser && !currentUser) navigate("/auth/login");
    if (!loadingUser && currentUser && !currentUser.admin) navigate("/songs");

    if (currentUser?.admin) {
      loadPlans().finally(() => setLoading(false));
    }
  }, [loadingUser, currentUser]);

  const selectPlan = async (plan: Plan) => {
    try {
      setSelectedPlanId(plan.id);
      const response = await fetchWithAuth(`/api/admin/plans/${plan.id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      const detailedPlan = result.data || result;
      setSelectedPlanDetails(detailedPlan);
      setForm({ ...detailedPlan });
      setFeaturesText((detailedPlan.features || []).join(", "));
    } catch (error: any) {
      console.error("Error loading plan details:", error);
      toast({ title: "Erro", description: "Falha ao carregar plano", variant: "destructive" });
    }
  };

  const savePlan = async () => {
    try {
      const payload = {
        plan: {
          name: form.name,
          description: form.description,
          price_cents: Number(form.price_cents),
          duration_days: Number(form.duration_days),
          interval: form.interval,
          active: Boolean(form.active),
          sort_order: Number(form.sort_order || 0),
        },
        features: featuresText.split(",").map((value) => value.trim()).filter(Boolean),
      };

      const url = selectedPlanId ? `/api/admin/plans/${selectedPlanId}` : "/api/admin/plans";
      const method = selectedPlanId ? "PATCH" : "POST";

      const response = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      toast({ title: "Sucesso", description: "Plano salvo com sucesso." });
      setSelectedPlanId(null);
      setSelectedPlanDetails(null);
      setForm(emptyPlan);
      setFeaturesText("");
      await loadPlans();
    } catch (error: any) {
      console.error("Error saving plan:", error);
      toast({ title: "Erro", description: error.message || "Falha ao salvar plano", variant: "destructive" });
    }
  };

  const toggleActive = async (plan: Plan) => {
    try {
      const url = `/api/admin/plans/${plan.id}/${plan.active ? "deactivate" : "activate"}`;
      const response = await fetchWithAuth(url, { method: "PATCH" });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      await loadPlans();
    } catch (error: any) {
      console.error("Error toggling plan:", error);
      toast({ title: "Erro", description: "Falha ao alterar plano", variant: "destructive" });
    }
  };

  if (loading || loadingUser) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6 grid lg:grid-cols-3 gap-6 pb-20 md:pb-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Planos</CardTitle>
          <CardDescription>Crie, edite e ative/desative planos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button className="w-full" variant="outline" onClick={() => { setSelectedPlanId(null); setSelectedPlanDetails(null); setForm(emptyPlan); setFeaturesText(""); }}>
            Novo plano
          </Button>
          {plans.map((plan) => (
            <div key={plan.id} className={`border rounded-md p-3 cursor-pointer ${selectedPlanId === plan.id ? "border-primary" : "border-border"}`} onClick={() => selectPlan(plan)}>
              <div className="flex items-center justify-between">
                <strong>{plan.name}</strong>
                <Badge variant={plan.active ? "default" : "secondary"}>{plan.active ? "Ativo" : "Inativo"}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">Assinantes: {plan.subscribers_count || 0}</div>
              <Button className="mt-2" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); toggleActive(plan); }}>
                {plan.active ? "Desativar" : "Ativar"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{selectedPlanId ? "Editar plano" : "Novo plano"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Preço (centavos)</Label>
              <Input type="number" value={form.price_cents || 0} onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Duração (dias)</Label>
              <Input type="number" value={form.duration_days || 30} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Intervalo</Label>
              <Input value={form.interval || "month"} onChange={(e) => setForm({ ...form, interval: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <Label>Funcionalidades (separadas por vírgula)</Label>
            <Input value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="multi_library, export_pdf" />
          </div>

          <Button onClick={savePlan}>Salvar plano</Button>

          {selectedPlanDetails && (
            <div className="pt-4 border-t space-y-2">
              <h3 className="font-semibold">Clientes assinados neste plano</h3>
              {(selectedPlanDetails.subscribers || []).length === 0 && (
                <p className="text-sm text-muted-foreground">Sem clientes ativos neste plano.</p>
              )}
              {(selectedPlanDetails.subscribers || []).map((subscriber) => (
                <div key={subscriber.id} className="border rounded-md p-2 text-sm">
                  <div className="font-medium">{subscriber.name || subscriber.email}</div>
                  <div className="text-muted-foreground">{subscriber.email}</div>
                  <div>Início: {new Date(subscriber.started_at).toLocaleDateString("pt-BR")}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlansAdmin;
