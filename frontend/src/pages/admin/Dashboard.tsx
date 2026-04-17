import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Package, Zap } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-lg text-gray-600">Gerencie planos e funcionalidades da plataforma</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Plans Card */}
          <Link
            to="/admin/plans"
            className="bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all p-6 group"
          >
            <div className="flex items-center justify-between mb-4">
              <Package className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                Planos
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Planos de Assinatura</h2>
            <p className="text-gray-600 mb-4">
              Crie, edite e gerencie planos de assinatura mensais e anuais. Configure limites de recursos e preços.
            </p>
            <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
              <span>Acessar</span>
              <span className="ml-2">→</span>
            </div>
          </Link>

          {/* Features Card */}
          <Link
            to="/admin/features"
            className="bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all p-6 group"
          >
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-12 h-12 text-green-600 group-hover:scale-110 transition-transform" />
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                Funcionalidades
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Funcionalidades</h2>
            <p className="text-gray-600 mb-4">
              Crie e gerencie funcionalidades que podem ser associadas aos planos. Controle o acesso dos usuários.
            </p>
            <div className="flex items-center text-green-600 font-medium group-hover:translate-x-2 transition-transform">
              <span>Acessar</span>
              <span className="ml-2">→</span>
            </div>
          </Link>

          {/* Settings Card */}
          <div className="bg-white rounded-lg border border-gray-200 border-dashed opacity-50 p-6 cursor-not-allowed">
            <div className="flex items-center justify-between mb-4">
              <Settings className="w-12 h-12 text-gray-400" />
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                Em Breve
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Configurações</h2>
            <p className="text-gray-500 mb-4">
              Configure parâmetros globais de faturamento, moeda, impostos e outras opções do sistema.
            </p>
            <div className="flex items-center text-gray-500 font-medium">
              <span>Acessar</span>
              <span className="ml-2">→</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Informações Importantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Planos de Assinatura</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Suporte a recorrência mensal (30 dias) e anual (365 dias)</li>
                <li>✓ Configuração flexível de limites (músicas, setlists, colaboradores)</li>
                <li>✓ Associação de funcionalidades por plano</li>
                <li>✓ Ativação/desativação sem deletar dados históricos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Funcionalidades</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Controle granular de acesso por funcionalidade</li>
                <li>✓ Associação múltipla com planos</li>
                <li>✓ Sistema de permissões integrado</li>
                <li>✓ Aplicação automática via Feature Enforcer</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
