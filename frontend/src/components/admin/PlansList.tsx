import React from 'react';
import { Plan } from '../../lib/types';

interface PlansListProps {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => Promise<void>;
  onCreateNew: () => void;
  isLoading?: boolean;
}

const PlansList: React.FC<PlansListProps> = ({
  plans,
  onEdit,
  onDelete,
  onCreateNew,
  isLoading = false,
}) => {
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const handleDelete = async (plan: Plan) => {
    if (window.confirm(`Tem certeza que deseja deletar o plano "${plan.name}"?`)) {
      setDeletingId(plan.id);
      try {
        await onDelete(plan);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planos</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Novo Plano
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Nome</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Preço</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Intervalo</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Músicas</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Setlists</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Funcionalidades</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {plans.map(plan => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{plan.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatPrice(plan.price_cents)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {plan.interval === 'month' ? 'Mês' : plan.interval === 'year' ? 'Ano' : 'Uma Vez'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{plan.max_songs}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{plan.max_setlists}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <span className="text-xs text-gray-500">
                    {plan.features?.length || 0} recursos
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      plan.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {plan.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => onEdit(plan)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(plan)}
                    disabled={deletingId === plan.id}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingId === plan.id ? 'Deletando...' : 'Deletar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {plans.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum plano encontrado</p>
        </div>
      )}
    </div>
  );
};

export default PlansList;
