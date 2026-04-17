import { useState } from "react";
import { Plan } from "@/services/api/billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const formatBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface FeatureItem {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
}

interface PlanExtended extends Plan {
  features_list?: FeatureItem[];
}

interface PlanComparisonProps {
  plans: PlanExtended[];
  selectedPlanId: number | null;
  onSelectPlan: (planId: number) => void;
  currentPlanId?: number;
  loading?: boolean;
}

// Group plans by type (Free, Pro, Premium)
const groupPlansByType = (plans: Plan[]) => {
  const grouped: { [key: string]: Plan[] } = {};

  plans.forEach((plan) => {
    const baseType = plan.name.split(" ")[0]; // Get "Free", "Pro", or "Premium"
    if (!grouped[baseType]) {
      grouped[baseType] = [];
    }
    grouped[baseType].push(plan);
  });

  // Sort each group: monthly first, annual second
  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => {
      if (a.interval === "month" && b.interval === "year") return -1;
      if (a.interval === "year" && b.interval === "month") return 1;
      return 0;
    });
  });

  return grouped;
};

export const PlanComparison = ({
  plans,
  selectedPlanId,
  onSelectPlan,
  currentPlanId,
  loading = false,
}: PlanComparisonProps) => {
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");

  const groupedPlans = groupPlansByType(plans);

  // Filter plans based on selected billing cycle
  const displayPlans = Object.entries(groupedPlans).map(([type, typePlans]) => ({
    type,
    plans: typePlans.filter((p) => p.interval === billingCycle),
  }));

  const calculateMonthlyPrice = (plan: Plan): number => {
    if (plan.interval === "month") {
      return plan.price_cents;
    } else if (plan.interval === "year") {
      return Math.round(plan.price_cents / 12);
    }
    return 0;
  };

  const calculateSavings = (monthly: Plan, annual: Plan): number => {
    const monthlyTotal = monthly.price_cents * 12;
    const annualPrice = annual.price_cents;
    return Math.round(((monthlyTotal - annualPrice) / monthlyTotal) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Billing Cycle Selector */}
      <div className="flex items-center justify-center gap-4">
        <p className="text-sm font-medium">Escolha o período:</p>
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle("month")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === "month"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle("year")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === "year"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayPlans.map(({ type, plans: typePlans }) => {
          if (typePlans.length === 0) return null;

          const plan = typePlans[0];
          const isFree = plan.price_cents === 0;
          const isSelected = selectedPlanId === plan.id;
          const isCurrent = currentPlanId === plan.id;
          const monthlyPrice = calculateMonthlyPrice(plan);

          // Get savings info if comparing annual
          let savingsPercent = 0;
          if (billingCycle === "year" && groupedPlans[type].length > 1) {
            const monthlyPlan = groupedPlans[type].find((p) => p.interval === "month");
            if (monthlyPlan) {
              savingsPercent = calculateSavings(monthlyPlan, plan);
            }
          }

          return (
            <div key={plan.id} className="relative">
              {/* Savings Badge */}
              {savingsPercent > 0 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-green-600 text-white">Economize {savingsPercent}%</Badge>
                </div>
              )}

              <Card
                className={`h-full flex flex-col transition-all ${
                  isSelected ? "ring-2 ring-primary" : ""
                } ${isCurrent ? "ring-2 ring-amber-500" : ""}`}
              >
                <CardHeader className={isFree ? "" : "bg-gradient-to-r from-blue-50 to-indigo-50"}></CardHeader>
                <CardContent className="pt-6 flex flex-col flex-1">
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                      </div>
                      {isCurrent && <Badge className="bg-amber-600">Atual</Badge>}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {isFree ? (
                      <div className="text-3xl font-bold">Gratuito</div>
                    ) : (
                      <div>
                        <div className="text-4xl font-bold">
                          {formatBRL(monthlyPrice)}
                          <span className="text-lg text-muted-foreground">/mês</span>
                        </div>
                        {billingCycle === "year" && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Cobrado como {formatBRL(plan.price_cents)}/ano
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    <p className="text-sm font-semibold text-muted-foreground">Incluso neste plano:</p>
                    <ul className="space-y-2">
                      {/* Max items */}
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {plan.max_songs === 999 ? "Até 999" : plan.max_songs} músicas
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {plan.max_setlists === 999 ? "Até 999" : plan.max_setlists} setlists
                        </span>
                      </li>
                      <li
                        className={`flex items-start gap-2 ${
                          plan.max_collaborators === 0 ? "opacity-50" : ""
                        }`}
                      >
                        {plan.max_collaborators > 0 ? (
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="text-sm">
                          {plan.max_collaborators === 0
                            ? "Sem colaboradores"
                            : plan.max_collaborators === 999
                              ? "Colaboradores ilimitados"
                              : `Até ${plan.max_collaborators} colaboradores`}
                        </span>
                      </li>

                      {/* Extra features from features_list */}
                      {plan.features_list && plan.features_list.length > 0 && (
                        <>
                          {plan.features_list.map((feature) => (
                            <li key={feature.key} className="flex items-start gap-2">
                              {feature.enabled ? (
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              ) : (
                                <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                              )}
                              <span className="text-sm">{feature.label}</span>
                            </li>
                          ))}
                        </>
                      )}
                    </ul>
                  </div>

                  {/* Select Button */}
                  <div className="mt-6 pt-6 border-t">
                    <Button
                      onClick={() => onSelectPlan(plan.id)}
                      disabled={loading || isCurrent}
                      variant={isSelected ? "default" : "outline"}
                      className="w-full"
                    >
                      {isCurrent ? "Plano Atual" : isSelected ? "Selecionado" : "Selecionar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Plan Details Comparison (Optional - for detailed view) */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação Detalhada</CardTitle>
          <CardDescription>Veja todas as diferenças entre os planos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Recurso</th>
                  {plans
                    .filter((p) => p.interval === billingCycle)
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((plan) => (
                      <th key={plan.id} className="text-center py-3 px-4 font-semibold">
                        {plan.name}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Preço</td>
                  {plans
                    .filter((p) => p.interval === billingCycle)
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.price_cents === 0 ? "Gratuito" : formatBRL(calculateMonthlyPrice(plan))}
                      </td>
                    ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Músicas</td>
                  {plans
                    .filter((p) => p.interval === billingCycle)
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.max_songs === 999 ? "Ilimitado" : plan.max_songs}
                      </td>
                    ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Setlists</td>
                  {plans
                    .filter((p) => p.interval === billingCycle)
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.max_setlists === 999 ? "Ilimitado" : plan.max_setlists}
                      </td>
                    ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">Colaboradores</td>
                  {plans
                    .filter((p) => p.interval === billingCycle)
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.max_collaborators === 0
                          ? "-"
                          : plan.max_collaborators === 999
                            ? "Ilimitado"
                            : plan.max_collaborators}
                      </td>
                    ))}
                </tr>

                {/* Feature Rows - Dynamic from features_list */}
                {(() => {
                  const allFeatures: FeatureItem[] = [];
                  plans
                    .filter((p) => p.interval === billingCycle)
                    .forEach((plan) => {
                      if (plan.features_list) {
                        plan.features_list.forEach((feature) => {
                          if (!allFeatures.find((f) => f.key === feature.key)) {
                            allFeatures.push(feature);
                          }
                        });
                      }
                    });

                  return allFeatures.map((feature) => (
                    <tr key={feature.key} className="border-b">
                      <td className="py-3 px-4 font-medium">{feature.label}</td>
                      {plans
                        .filter((p) => p.interval === billingCycle)
                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                        .map((plan) => {
                          const hasFeature = plan.features_list?.some((f) => f.key === feature.key && f.enabled) || false;
                          return (
                            <td key={plan.id} className="text-center py-3 px-4">
                              {hasFeature ? (
                                <Check className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-red-400 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
