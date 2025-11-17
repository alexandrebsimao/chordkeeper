import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchWithAuth } from '@/lib/auth';
import { Users, Music, ListMusic, Database, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardStats {
  total_users: number;
  active_subscriptions: number;
  total_songs: number;
  total_setlists: number;
  total_libraries: number;
  revenue_this_month: number;
}

interface DashboardData {
  stats: DashboardStats;
  recent_users: any[];
  recent_subscriptions: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/dashboard');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Erro ao carregar dashboard</p>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total de Usuários',
      value: data.stats.total_users,
      icon: Users,
      description: 'Usuários registrados',
    },
    {
      title: 'Assinaturas Ativas',
      value: data.stats.active_subscriptions,
      icon: TrendingUp,
      description: 'Planos pagos ativos',
    },
    {
      title: 'Total de Músicas',
      value: data.stats.total_songs,
      icon: Music,
      description: 'Músicas cadastradas',
    },
    {
      title: 'Total de Setlists',
      value: data.stats.total_setlists,
      icon: ListMusic,
      description: 'Setlists criadas',
    },
    {
      title: 'Bibliotecas',
      value: data.stats.total_libraries,
      icon: Database,
      description: 'Bibliotecas totais',
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${(data.stats.revenue_this_month / 100).toFixed(2)}`,
      icon: DollarSign,
      description: 'Receita recorrente',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema ChordKeeper</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usuários Recentes</CardTitle>
            <CardDescription>Últimos 10 usuários cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recent_users.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinaturas Recentes</CardTitle>
            <CardDescription>Últimas 10 assinaturas criadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recent_subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{sub.user.email}</p>
                    <p className="text-xs text-muted-foreground">{sub.plan.name}</p>
                  </div>
                  <span className="text-xs font-medium">
                    R$ {(sub.plan.price_cents / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
