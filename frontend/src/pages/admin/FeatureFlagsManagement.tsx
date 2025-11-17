import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '@/lib/auth';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  allowed_plans: string[] | null;
  config: any | null;
}

export default function FeatureFlagsManagement() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureFlag | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    enabled: false,
    allowed_plans: '',
  });

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/feature_flags');
      if (response.ok) {
        const data = await response.json();
        setFeatures(data);
      }
    } catch (error) {
      console.error('Erro ao carregar feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      allowed_plans: formData.allowed_plans.split(',').map(p => p.trim()).filter(Boolean),
    };

    try {
      const url = editingFeature ? `/api/admin/feature_flags/${editingFeature.id}` : '/api/admin/feature_flags';
      const method = editingFeature ? 'PATCH' : 'POST';
      
      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_flag: payload }),
      });

      if (response.ok) {
        toast({
          title: editingFeature ? 'Feature atualizada' : 'Feature criada',
          description: 'Operação realizada com sucesso',
        });
        setDialogOpen(false);
        resetForm();
        loadFeatures();
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.errors?.join(', ') || 'Erro ao salvar feature',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar feature',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (feature: FeatureFlag) => {
    try {
      const response = await fetchWithAuth(`/api/admin/feature_flags/${feature.id}/toggle`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast({
          title: 'Feature atualizada',
          description: `Feature ${feature.enabled ? 'desativada' : 'ativada'} com sucesso`,
        });
        loadFeatures();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar feature',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (feature: FeatureFlag) => {
    setEditingFeature(feature);
    setFormData({
      key: feature.key,
      name: feature.name,
      description: feature.description || '',
      enabled: feature.enabled,
      allowed_plans: feature.allowed_plans?.join(', ') || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta feature?')) return;

    try {
      const response = await fetchWithAuth(`/api/admin/feature_flags/${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        toast({
          title: 'Feature excluída',
          description: 'Feature removida com sucesso',
        });
        loadFeatures();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir feature',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingFeature(null);
    setFormData({
      key: '',
      name: '',
      description: '',
      enabled: false,
      allowed_plans: '',
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground">Controle de funcionalidades por plano</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Feature
        </Button>
      </div>

      <div className="grid gap-4">
        {features.map((feature) => (
          <Card key={feature.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{feature.name}</CardTitle>
                    <Badge variant={feature.enabled ? 'default' : 'secondary'}>
                      {feature.enabled ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{feature.key}</code>
                  </CardDescription>
                  {feature.description && (
                    <p className="text-sm text-muted-foreground mt-2">{feature.description}</p>
                  )}
                  {feature.allowed_plans && feature.allowed_plans.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">Planos:</span>
                      {feature.allowed_plans.map((plan) => (
                        <Badge key={plan} variant="outline" className="text-xs">
                          {plan}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggle(feature)}
                    title={feature.enabled ? 'Desativar' : 'Ativar'}
                  >
                    {feature.enabled ? (
                      <ToggleRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(feature)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(feature.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFeature ? 'Editar Feature' : 'Nova Feature'}</DialogTitle>
            <DialogDescription>
              {editingFeature ? 'Edite as informações da feature' : 'Crie uma nova feature flag'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Chave (key)</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="ex: public_sharing"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Compartilhamento Público"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva para que serve esta feature"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowed_plans">Planos permitidos (separados por vírgula)</Label>
              <Input
                id="allowed_plans"
                value={formData.allowed_plans}
                onChange={(e) => setFormData({ ...formData, allowed_plans: e.target.value })}
                placeholder="ex: Pro, Team"
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para permitir em todos os planos
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="enabled">Feature Ativa</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingFeature ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
