import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import FeatureForm from '../../components/admin/FeatureForm';
import FeaturesList from '../../components/admin/FeaturesList';
import { Feature } from '../../lib/types';

const AdminFeatures: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<Feature | undefined>();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth('/api/admin/features');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const data = result.data || result;
      setFeatures(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar funcionalidades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedFeature(undefined);
    setIsFormVisible(true);
  };

  const handleEdit = (feature: Feature) => {
    setSelectedFeature(feature);
    setIsFormVisible(true);
  };

  const handleSubmit = async (formData: any) => {
    setIsSaving(true);
    try {
      const method = selectedFeature ? 'PATCH' : 'POST';
      const url = selectedFeature ? `/api/admin/features/${selectedFeature.id}` : '/api/admin/features';
      
      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: formData }),
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const savedFeature = result.data || result;
      
      if (selectedFeature) {
        setFeatures(features.map(f => f.id === savedFeature.id ? savedFeature : f));
      } else {
        setFeatures([...features, savedFeature]);
      }

      setIsFormVisible(false);
      setSelectedFeature(undefined);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao salvar funcionalidade';
      throw { errors: { general: error } };
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (feature: Feature) => {
    try {
      const response = await fetchWithAuth(`/api/admin/features/${feature.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setFeatures(features.filter(f => f.id !== feature.id));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro ao deletar funcionalidade';
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Gerenciamento de Funcionalidades</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {isFormVisible ? (
              <FeatureForm
                feature={selectedFeature}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsFormVisible(false);
                  setSelectedFeature(undefined);
                }}
                isLoading={isSaving}
              />
            ) : (
              <FeaturesList
                features={features}
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
                <p className="text-gray-600">Total de Funcionalidades</p>
                <p className="text-2xl font-bold text-gray-900">{features.length}</p>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-gray-600">Últimas Adicionadas</p>
                <div className="mt-2 space-y-1">
                  {features.slice(-3).map(f => (
                    <div key={f.id} className="text-xs text-gray-600">
                      <span className="font-mono">{f.key}</span>
                    </div>
                  ))}
                  {features.length === 0 && (
                    <p className="text-xs text-gray-500">Nenhuma funcionalidade criada</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFeatures;
