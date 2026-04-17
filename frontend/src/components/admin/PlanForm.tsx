import React, { useState, useEffect } from 'react';
import { Feature, Plan } from '../../lib/types';

interface PlanFormProps {
  plan?: Plan;
  features: Feature[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const PlanForm: React.FC<PlanFormProps> = ({
  plan,
  features,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_cents: 0,
    interval: 'month',
    duration_days: 30,
    max_songs: 100,
    max_setlists: 10,
    max_collaborators: 1,
    sort_order: 0,
    active: true,
    feature_ids: [] as number[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price_cents: plan.price_cents,
        interval: plan.interval,
        duration_days: plan.duration_days,
        max_songs: plan.max_songs,
        max_setlists: plan.max_setlists,
        max_collaborators: plan.max_collaborators || 1,
        sort_order: plan.sort_order,
        active: plan.active,
        feature_ids: plan.features?.map(f => f.id) || [],
      });
    }
  }, [plan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                type === 'number' ? parseInt(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleFeatureChange = (featureId: number) => {
    setFormData(prev => ({
      ...prev,
      feature_ids: prev.feature_ids.includes(featureId)
        ? prev.feature_ids.filter(id => id !== featureId)
        : [...prev.feature_ids, featureId],
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
      <h2 className="text-2xl font-bold mb-6">{plan ? 'Editar Plano' : 'Criar Plano'}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preço (em centavos) *
          </label>
          <input
            type="number"
            name="price_cents"
            value={formData.price_cents}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.price_cents ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.price_cents && <p className="text-red-500 text-sm mt-1">{errors.price_cents}</p>}
        </div>

        {/* Interval */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intervalo *
          </label>
          <select
            name="interval"
            value={formData.interval}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">Mês</option>
            <option value="year">Ano</option>
            <option value="once">Uma Vez</option>
          </select>
        </div>

        {/* Duration Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duração (dias) *
          </label>
          <input
            type="number"
            name="duration_days"
            value={formData.duration_days}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Max Songs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Máximo de Músicas
          </label>
          <input
            type="number"
            name="max_songs"
            value={formData.max_songs}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Max Setlists */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Máximo de Setlists
          </label>
          <input
            type="number"
            name="max_setlists"
            value={formData.max_setlists}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Max Collaborators */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Máximo de Colaboradores
          </label>
          <input
            type="number"
            name="max_collaborators"
            value={formData.max_collaborators}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ordem
          </label>
          <input
            type="number"
            name="sort_order"
            value={formData.sort_order}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Funcionalidades
        </label>
        <div className="space-y-2 bg-gray-50 p-4 rounded-md max-h-40 overflow-y-auto">
          {features.map(feature => (
            <label key={feature.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.feature_ids.includes(feature.id)}
                onChange={() => handleFeatureChange(feature.id)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                {feature.label}
                {feature.description && (
                  <span className="text-xs text-gray-500 block">{feature.description}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Active */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="active"
          name="active"
          checked={formData.active}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="active" className="text-sm font-medium text-gray-700">
          Ativo
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Salvando...' : plan ? 'Atualizar Plano' : 'Criar Plano'}
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

export default PlanForm;
