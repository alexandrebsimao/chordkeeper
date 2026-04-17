module Api
  module Admin
    class CustomersController < BaseController
      include RequiresAdmin

      def index
        users = User.includes(user_subscriptions: :plan).order(:created_at)

        render json: {
          data: users.map do |user|
            current_subscription = user.current_subscription

            {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              created_at: user.created_at,
              subscription: current_subscription ? serialize_subscription(current_subscription) : nil
            }
          end
        }
      end

      def show
        user = User.includes(user_subscriptions: :plan).find(params[:id])

        render json: {
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            subscriptions: user.user_subscriptions.order(created_at: :desc).map { |subscription| serialize_subscription(subscription) }
          }
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Cliente não encontrado" }, status: :not_found
      end

      def update_subscription
        user = User.find(params[:id])
        subscription = user.current_subscription || user.user_subscriptions.order(created_at: :desc).first

        return render json: { error: "Assinatura não encontrada" }, status: :not_found if subscription.nil?

        if params[:plan_id].present?
          new_plan = Plan.find(params[:plan_id])
          subscription.plan = new_plan
        end

        subscription.expires_at = Time.zone.parse(params[:expires_at]) if params[:expires_at].present?
        subscription.status = params[:status] if params[:status].present?
        subscription.save!

        render json: { data: serialize_subscription(subscription), message: "Assinatura do cliente atualizada" }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Recurso não encontrado" }, status: :not_found
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def serialize_subscription(subscription)
        {
          id: subscription.id,
          plan_id: subscription.plan_id,
          plan_name: subscription.plan.name,
          status: subscription.status,
          started_at: subscription.started_at,
          expires_at: subscription.expires_at,
          cancelled_at: subscription.cancelled_at
        }
      end
    end
  end
end
