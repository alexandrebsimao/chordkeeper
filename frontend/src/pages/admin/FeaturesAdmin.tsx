import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const FeaturesAdmin = () => {
  const navigate = useNavigate();
  const { currentUser, loading: loadingUser } = useCurrentUser();
  const { toast } = useToast();

  const [features, setFeatures] = useState<any[]>([]);
  const [plans, setPlans] = useState<Array<{ id: number; name: string }>>([]);

  const load = async () => {
    try {
      const response = await fetchWithAuth("/api/admin/feature_flags");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      setFeatures(result.data || []);
      setPlans(result.plans || []);
    } catch (error) {
      console.error("Error loading features:", error);
    }
  };

  useEffect(() => {
    if (!loadingUser && !currentUser) navigate("/auth/login");
    if (!loadingUser && currentUser && !currentUser.admin) navigate("/songs");
    if (currentUser?.admin) load();
  }, [loadingUser, currentUser]);

  const toggleAllowedPlan = (featureId: number, planId: number) => {
    setFeatures((previous) =>
      previous.map((feature) => {
        if (feature.id !== featureId) return feature;

        const current = feature.allowed_plan_ids || [];
        const next = current.includes(planId) ? current.filter((id: number) => id !== planId) : [...current, planId];

        return { ...feature, allowed_plan_ids: next };
      })
    );
  };

  const saveFeature = async (feature: any) => {
    try {
      const response = await fetchWithAuth(`/api/admin/feature_flags/${feature.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature_flag: {
            enabled: feature.enabled,
            allowed_plan_ids: feature.allowed_plan_ids || [],
          },
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      toast({ title: "Sucesso", description: "Funcionalidade atualizada" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao atualizar", variant: "destructive" });
    }
  };

  if (loadingUser) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold">Funcionalidades por plano</h1>
        <p className="text-muted-foreground">Identifique e habilite facilmente quais recursos vão para cada plano.</p>
      </div>

      {features.map((feature) => (
        <Card key={feature.id}>
          <CardHeader>
            <CardTitle>{feature.name}</CardTitle>
            <CardDescription>{feature.key} - {feature.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={feature.enabled} onChange={(e) => setFeatures((previous) => previous.map((item) => item.id === feature.id ? { ...item, enabled: e.target.checked } : item))} />
              Habilitada
            </label>

            <div className="grid md:grid-cols-3 gap-2">
              {plans.map((plan) => (
                <label key={plan.id} className="flex items-center gap-2 text-sm border rounded-md p-2">
                  <input
                    type="checkbox"
                    checked={(feature.allowed_plan_ids || []).includes(plan.id)}
                    onChange={() => toggleAllowedPlan(feature.id, plan.id)}
                  />
                  {plan.name}
                </label>
              ))}
            </div>

            <Button onClick={() => saveFeature(feature)}>Salvar funcionalidade</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FeaturesAdmin;
