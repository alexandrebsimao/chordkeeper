import React from 'react';
import { Feature } from '../../lib/types';

interface FeaturesListProps {
  features: Feature[];
  onEdit: (feature: Feature) => void;
  onDelete: (feature: Feature) => Promise<void>;
  onCreateNew: () => void;
  isLoading?: boolean;
}

const FeaturesList: React.FC<FeaturesListProps> = ({
  features,
  onEdit,
  onDelete,
  onCreateNew,
  isLoading = false,
}) => {
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const handleDelete = async (feature: Feature) => {
    if (window.confirm(`Tem certeza que deseja deletar a funcionalidade "${feature.label}"?`)) {
      setDeletingId(feature.id);
      try {
        await onDelete(feature);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Funcionalidades</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Nova Funcionalidade
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Chave</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Nome</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Descrição</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ordem</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {features.map(feature => (
              <tr key={feature.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-900 font-medium">
                  {feature.key}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{feature.label}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                  {feature.description || '—'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{feature.sort_order || 0}</td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => onEdit(feature)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(feature)}
                    disabled={deletingId === feature.id}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingId === feature.id ? 'Deletando...' : 'Deletar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {features.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma funcionalidade encontrada</p>
        </div>
      )}
    </div>
  );
};

export default FeaturesList;
