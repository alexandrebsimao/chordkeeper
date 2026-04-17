module Api
  module Admin
    class PlansController < BaseController
      before_action :set_plan, only: [:show, :update, :destroy, :activate, :deactivate, :update_features]

      def index
        @plans = Plan.ordered.includes(:features)
        render json: @plans.map { |plan| serialize_plan(plan) }
      end

      def show
        render json: serialize_plan(@plan)
      end

      def create
        @plan = Plan.new(plan_params)

        if @plan.save
          # Associate features if provided (features come at top level as strings/keys)
          if params[:features].present?
            invalid_features = []
            params[:features].each do |feature_key|
              added = @plan.add_feature(feature_key)
              invalid_features << feature_key unless added
            end

            if invalid_features.any?
              Rails.logger.warn("Invalid features for plan #{@plan.id}: #{invalid_features.join(', ')}")
            end
          end

          render json: serialize_plan(@plan), status: :created
        else
          render json: { errors: @plan.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        # First update plan attributes
        if @plan.update(plan_params)
          # Then update features if provided (features come at top level as strings/keys)
          if params[:features].present?
            # Remove all existing features
            @plan.plan_features.destroy_all

            # Add new features
            invalid_features = []
            params[:features].each do |feature_key|
              added = @plan.add_feature(feature_key)
              invalid_features << feature_key unless added
            end

            if invalid_features.any?
              Rails.logger.warn("Invalid features for plan #{@plan.id}: #{invalid_features.join(', ')}")
            end
          end

          render json: serialize_plan(@plan)
        else
          render json: { errors: @plan.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @plan.destroy
        head :no_content
      end

      def update_features
        if params[:feature_ids].present?
          # Remove all existing features
          @plan.plan_features.destroy_all

          # Add new features
          params[:feature_ids].each do |feature_id|
            feature = Feature.find(feature_id)
            @plan.add_feature(feature.key) if feature
          end

          render json: serialize_plan(@plan)
        else
          render json: { errors: ["No features provided"] }, status: :unprocessable_entity
        end
      end

      def activate
        @plan.update(active: true)
        render json: serialize_plan(@plan)
      end

      def deactivate
        @plan.update(active: false)
        render json: serialize_plan(@plan)
      end

      private

      def set_plan
        @plan = Plan.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Plano não encontrado" }, status: :not_found
      end

      def plan_params
        params.require(:plan).permit(
          :name, :description, :price_cents, :interval, :duration_days,
          :max_songs, :max_setlists, :max_collaborators, :sort_order, :active
        )
      end

      def serialize_plan(plan, include_customers: false)
        payload = {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price_cents: plan.price_cents,
          formatted_price: "%.2f" % (plan.price_cents / 100.0),
          interval: plan.interval,
          duration_days: plan.duration_days,
          max_songs: plan.max_songs,
          max_setlists: plan.max_setlists,
          max_collaborators: plan.max_collaborators,
          active: plan.active,
          sort_order: plan.sort_order,
          features: plan.features.map { |f| f.key },
          features_full: plan.features.map { |f| { id: f.id, key: f.key, label: f.label } },
          subscribers_count: plan.user_subscriptions.active.count
        }

        return payload unless include_customers

        payload[:subscribers] = plan.user_subscriptions.active.includes(:user).map do |subscription|
          {
            id: subscription.id,
            user_id: subscription.user_id,
            name: subscription.user.name,
            email: subscription.user.email,
            started_at: subscription.started_at,
            expires_at: subscription.expires_at,
            status: subscription.status
          }
        end
        payload
      end
    end
  end
end
