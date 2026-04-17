import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const CustomersAdmin = () => {
  const navigate = useNavigate();
  const { currentUser, loading: loadingUser } = useCurrentUser();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<any | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [planId, setPlanId] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState("active");

  const loadData = async () => {
    try {
      const [customersRes, plansRes] = await Promise.all([
        fetchWithAuth("/api/admin/customers"),
        fetchWithAuth("/api/admin/plans"),
      ]);

      if (!customersRes.ok || !plansRes.ok) throw new Error("Erro ao carregar dados");

      const customersResult = await customersRes.json();
      const plansResult = await plansRes.json();

      const customersData = customersResult.data || customersResult;
      const plansData = plansResult.data || plansResult;

      setCustomers(Array.isArray(customersData) ? customersData : []);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    if (!loadingUser && !currentUser) navigate("/auth/login");
    if (!loadingUser && currentUser && !currentUser.admin) navigate("/songs");
    if (currentUser?.admin) loadData();
  }, [loadingUser, currentUser]);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);

  useEffect(() => {
    if (!selectedCustomer) return;

    setPlanId(selectedCustomer.subscription?.plan_id ? String(selectedCustomer.subscription.plan_id) : "");
    setStatus(selectedCustomer.subscription?.status || "active");

    if (selectedCustomer.subscription?.expires_at) {
      const date = new Date(selectedCustomer.subscription.expires_at);
      setExpiresAt(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
    } else {
      setExpiresAt("");
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomerDetails(null);
      return;
    }

    const fetchCustomerDetails = async () => {
      try {
        const response = await fetchWithAuth(`/api/admin/customers/${selectedCustomerId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        const details = result.data || result;
        setSelectedCustomerDetails(details);
      } catch (error) {
        console.error("Error loading customer details:", error);
      }
    };

    fetchCustomerDetails();
  }, [selectedCustomerId]);

  const updateSubscription = async () => {
    if (!selectedCustomerId) return;

    try {
      const response = await fetchWithAuth(`/api/admin/customers/${selectedCustomerId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId ? Number(planId) : undefined,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          status,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      toast({ title: "Sucesso", description: "Assinatura do cliente atualizada." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao atualizar assinatura", variant: "destructive" });
    }
  };

  if (loadingUser) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6 grid lg:grid-cols-3 gap-6 pb-20 md:pb-6">
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>Visualize clientes e seus planos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[70vh] overflow-auto">
          {customers.map((customer) => (
            <button
              key={customer.id}
              className={`w-full text-left border rounded-md p-3 ${selectedCustomerId === customer.id ? "border-primary" : "border-border"}`}
              onClick={() => setSelectedCustomerId(customer.id)}
            >
              <div className="font-medium">{customer.name || customer.email}</div>
              <div className="text-xs text-muted-foreground">{customer.email}</div>
              <div className="text-xs mt-1">Plano: {customer.subscription?.plan_name || "Sem plano"}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Gestão do cliente</CardTitle>
          <CardDescription>Edite plano e expiração da assinatura do cliente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedCustomer && <div className="text-muted-foreground">Selecione um cliente.</div>}

          {selectedCustomer && (
            <>
              <div>
                <strong>{selectedCustomer.name || selectedCustomer.email}</strong>
                <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label>Plano</Label>
                  <select className="w-full h-10 border rounded-md px-3" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                    <option value="">Sem plano</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Expiração</Label>
                  <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </div>

                <div>
                  <Label>Status</Label>
                  <select className="w-full h-10 border rounded-md px-3" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="active">active</option>
                    <option value="cancelled">cancelled</option>
                    <option value="expired">expired</option>
                    <option value="past_due">past_due</option>
                  </select>
                </div>
              </div>

              <Button onClick={updateSubscription}>Salvar alterações</Button>

              <div className="pt-4 border-t space-y-2">
                <h3 className="font-semibold">Histórico de planos</h3>
                {(selectedCustomerDetails?.subscriptions || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem assinaturas registradas.</p>
                )}
                {(selectedCustomerDetails?.subscriptions || []).map((subscription: any) => (
                  <div key={subscription.id} className="border rounded-md p-2 text-sm">
                    <div className="font-medium">{subscription.plan_name}</div>
                    <div>Status: {subscription.status}</div>
                    <div>Início: {subscription.started_at ? new Date(subscription.started_at).toLocaleDateString("pt-BR") : "-"}</div>
                    <div>Expiração: {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString("pt-BR") : "-"}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersAdmin;
