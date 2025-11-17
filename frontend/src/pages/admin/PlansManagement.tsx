import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchWithAuth } from '@/lib/auth';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  unlimited_songs?: boolean;
  unlimited_setlists?: boolean;
}

export default function PlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    price_cents: 0,
    interval: 'month',
    max_songs: '',
    max_setlists: '',
    max_collaborators: 1,
    features: [] as string[],
    active: true,
    sort_order: 0,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      max_songs: formData.max_songs === '' ? null : parseInt(formData.max_songs),
      max_setlists: formData.max_setlists === '' ? null : parseInt(formData.max_setlists),
    };

    try {
      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans';
      const method = editingPlan ? 'PATCH' : 'POST';
      
      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: payload }),
      });

      if (response.ok) {
        toast({
          title: editingPlan ? 'Plano atualizado' : 'Plano criado',
          description: 'Operação realizada com sucesso',
        });
        setDialogOpen(false);
        resetForm();
        loadPlans();
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.errors?.join(', ') || 'Erro ao salvar plano',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar plano',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price_cents: plan.price_cents,
      interval: plan.interval,
      max_songs: plan.max_songs?.toString() || '',
      max_setlists: plan.max_setlists?.toString() || '',
      max_collaborators: plan.max_collaborators,
      features: plan.features || [],
      active: plan.active,
      sort_order: plan.sort_order,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
      const response = await fetchWithAuth(`/api/admin/plans/${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        toast({
          title: 'Plano excluído',
          description: 'Plano removido com sucesso',
        });
        loadPlans();
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao excluir plano',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir plano',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price_cents: 0,
      interval: 'month',
      max_songs: '',
      max_setlists: '',
      max_collaborators: 1,
      features: [],
      active: true,
      sort_order: 0,
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Planos</h1>
          <p className="text-muted-foreground">Crie e gerencie os planos de assinatura</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.formatted_price}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Músicas:</span>
                <span>{plan.unlimited_songs ? 'Ilimitadas' : plan.max_songs}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Setlists:</span>
                <span>{plan.unlimited_setlists ? 'Ilimitadas' : plan.max_setlists}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Colaboradores:</span>
                <span>{plan.max_collaborators}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                {plan.active ? (
                  <span className="flex items-center text-green-600">
                    <Check className="h-3 w-3 mr-1" /> Ativo
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <X className="h-3 w-3 mr-1" /> Inativo
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Edite as informações do plano' : 'Crie um novo plano de assinatura'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço (centavos)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price_cents}
                  onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Intervalo</Label>
                <Select value={formData.interval} onValueChange={(value) => setFormData({ ...formData, interval: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Mensal</SelectItem>
                    <SelectItem value="year">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_songs">Máx. Músicas (vazio = ilimitado)</Label>
                <Input
                  id="max_songs"
                  type="number"
                  value={formData.max_songs}
                  onChange={(e) => setFormData({ ...formData, max_songs: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_setlists">Máx. Setlists (vazio = ilimitado)</Label>
                <Input
                  id="max_setlists"
                  type="number"
                  value={formData.max_setlists}
                  onChange={(e) => setFormData({ ...formData, max_setlists: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_collaborators">Máx. Colaboradores</Label>
                <Input
                  id="max_collaborators"
                  type="number"
                  value={formData.max_collaborators}
                  onChange={(e) => setFormData({ ...formData, max_collaborators: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordem de Exibição</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Plano Ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingPlan ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
