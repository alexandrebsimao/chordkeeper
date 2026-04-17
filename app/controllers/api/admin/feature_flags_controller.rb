module Api
  module Admin
    class FeatureFlagsController < BaseController
      def index
        ensure_default_flags!
        plans = Plan.ordered
        flags = FeatureFlag.ordered

        render json: {
          data: flags.map do |flag|
            {
              id: flag.id,
              key: flag.key,
              name: flag.name,
              description: flag.description,
              enabled: flag.enabled,
              allowed_plan_ids: flag.allowed_plan_ids,
              allowed_plans: plans.select { |plan| flag.allowed_plan_ids.include?(plan.id) }.map { |plan| { id: plan.id, name: plan.name } }
            }
          end,
          plans: plans.map { |plan| { id: plan.id, name: plan.name } }
        }
      end

      def update
        flag = FeatureFlag.find(params[:id])
        flag.assign_attributes(feature_flag_params.except(:allowed_plan_ids))
        flag.allowed_plan_ids = feature_flag_params[:allowed_plan_ids] if feature_flag_params.key?(:allowed_plan_ids)
        flag.save!

        render json: {
          data: {
            id: flag.id,
            key: flag.key,
            name: flag.name,
            description: flag.description,
            enabled: flag.enabled,
            allowed_plan_ids: flag.allowed_plan_ids
          },
          message: "Funcionalidade atualizada"
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Funcionalidade não encontrada" }, status: :not_found
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def ensure_default_flags!
        return if FeatureFlag.exists?

        [
          { key: "priority_support", name: "Suporte prioritário", description: "Atendimento prioritário para o cliente." },
          { key: "advanced_reports", name: "Relatórios avançados", description: "Acesso a relatórios avançados e exportações." },
          { key: "team_collaboration", name: "Colaboração em equipe", description: "Permite convidar múltiplos colaboradores." }
        ].each do |flag_data|
          FeatureFlag.create!(
            key: flag_data[:key],
            name: flag_data[:name],
            description: flag_data[:description],
            enabled: false,
            allowed_plan_ids: []
          )
        end
      end

      def feature_flag_params
        params.require(:feature_flag).permit(:name, :description, :enabled, allowed_plan_ids: [])
      end
    end
  end
end
