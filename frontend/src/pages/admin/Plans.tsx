import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import PlanForm from '../../components/admin/PlanForm';
import PlansList from '../../components/admin/PlansList';
import { Plan, Feature } from '../../lib/types';

const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, featuresRes] = await Promise.all([
        fetchWithAuth('/api/admin/plans'),
        fetchWithAuth('/api/admin/features'),
      ]);

      if (!plansRes.ok) throw new Error('Failed to load plans');
      if (!featuresRes.ok) throw new Error('Failed to load features');

      const plansData = await plansRes.json();
      const featuresData = await featuresRes.json();

      setPlans(Array.isArray(plansData) ? plansData : plansData.data || []);
      setFeatures(Array.isArray(featuresData) ? featuresData : featuresData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedPlan(undefined);
    setIsFormVisible(true);
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsFormVisible(true);
  };

  const handleSubmit = async (formData: any) => {
    setIsSaving(true);
    try {
      const method = selectedPlan ? 'PATCH' : 'POST';
      const url = selectedPlan ? `/api/admin/plans/${selectedPlan.id}` : '/api/admin/plans';

      const response = await fetchWithAuth(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.join(', ') || 'Erro ao salvar plano');
      }

      const savedPlan = await response.json();

      if (selectedPlan) {
        setPlans(plans.map(p => p.id === savedPlan.id ? savedPlan : p));
      } else {
        setPlans([...plans, savedPlan]);
      }

      setIsFormVisible(false);
      setSelectedPlan(undefined);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao salvar plano';
      throw { errors: { general: error } };
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    try {
      const response = await fetchWithAuth(`/api/admin/plans/${plan.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar plano');
      }

      setPlans(plans.filter(p => p.id !== plan.id));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao deletar plano';
      throw new Error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Gerenciamento de Planos</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {isFormVisible ? (
              <PlanForm
                plan={selectedPlan}
                features={features}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsFormVisible(false);
                  setSelectedPlan(undefined);
                }}
                isLoading={isSaving}
              />
            ) : (
              <PlansList
                plans={plans}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreateNew={handleCreateNew}
                isLoading={isLoading}
              />
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Total de Planos</p>
                <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {plans.filter(p => p.active).length}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Inativos</p>
                <p className="text-2xl font-bold text-gray-600">
                  {plans.filter(p => !p.active).length}
                </p>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-gray-600">Funcionalidades Disponíveis</p>
                <p className="text-2xl font-bold text-blue-600">{features.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPlans;
