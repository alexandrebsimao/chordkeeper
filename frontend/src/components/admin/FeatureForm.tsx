import React, { useState, useEffect } from 'react';
import { Feature } from '../../lib/types';

interface FeatureFormProps {
  feature?: Feature;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const FeatureForm: React.FC<FeatureFormProps> = ({
  feature,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    key: '',
    label: '',
    description: '',
    sort_order: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (feature) {
      setFormData({
        key: feature.key,
        label: feature.label,
        description: feature.description || '',
        sort_order: feature.sort_order || 0,
      });
    }
  }, [feature]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseInt(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      await onSubmit(formData);
    } catch (error: any) {
      if (error.errors) {
        setErrors(error.errors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6">{feature ? 'Editar Funcionalidade' : 'Criar Funcionalidade'}</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Chave (Key) *
        </label>
        <input
          type="text"
          name="key"
          value={formData.key}
          onChange={handleChange}
          placeholder="ex: export_pdf"
          disabled={!!feature}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.key ? 'border-red-500' : 'border-gray-300'
          } ${feature ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          required
        />
        {errors.key && <p className="text-red-500 text-sm mt-1">{errors.key}</p>}
        <p className="text-xs text-gray-500 mt-1">Identificador único (não pode ser alterado após criação)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome/Label *
        </label>
        <input
          type="text"
          name="label"
          value={formData.label}
          onChange={handleChange}
          placeholder="ex: Exportação em PDF"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.label ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {errors.label && <p className="text-red-500 text-sm mt-1">{errors.label}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descrição da funcionalidade para o usuário..."
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ordem de Exibição
        </label>
        <input
          type="number"
          name="sort_order"
          value={formData.sort_order}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Salvando...' : feature ? 'Atualizar Funcionalidade' : 'Criar Funcionalidade'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default FeatureForm;
