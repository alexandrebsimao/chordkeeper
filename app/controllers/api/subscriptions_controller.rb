module Api
  class SubscriptionsController < Api::ApiController
    before_action :set_subscription, only: [:update_payment_method, :change_plan, :cancel, :renew]

    def show
      subscription = current_user.current_subscription

      render json: {
        data: subscription ? serialize_subscription(subscription) : nil
      }
    end

    def create
      plan = Plan.find(params.require(:plan_id))

      subscription = Subscriptions::CreateService.new(
        user: current_user,
        plan: plan,
        customer_data: customer_data,
        payment_data: payment_data
      ).call

      render json: { data: serialize_subscription(subscription), message: "Assinatura criada com sucesso" }, status: :created
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Plano não encontrado" }, status: :not_found
    rescue StandardError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    def update_payment_method
      subscription = Subscriptions::UpdatePaymentMethodService.new(
        subscription: @subscription,
        payment_data: payment_data
      ).call

      render json: { data: serialize_subscription(subscription), message: "Forma de pagamento atualizada" }
    rescue StandardError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    def change_plan
      plan = Plan.find(params.require(:plan_id))
      subscription = Subscriptions::ChangePlanService.new(subscription: @subscription, new_plan: plan).call

      render json: { data: serialize_subscription(subscription), message: "Plano alterado com sucesso" }
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Plano não encontrado" }, status: :not_found
    rescue StandardError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    def cancel
      subscription = Subscriptions::CancelService.new(subscription: @subscription).call
      render json: { data: serialize_subscription(subscription), message: "Assinatura cancelada" }
    rescue StandardError => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    def renew
      # Renovação simples: estende vencimento baseado no plano atual
      @subscription.update!(
        status: UserSubscription::STATUSES[:active],
        expires_at: Time.current + @subscription.plan.duration_days.days,
        cancelled_at: nil
      )

      render json: { data: serialize_subscription(@subscription), message: "Assinatura renovada" }
    end

    def notifications
      notifications = current_user.subscription_notifications.recent.limit(50)

      render json: {
        data: notifications.map do |notification|
          {
            id: notification.id,
            kind: notification.kind,
            title: notification.title,
            message: notification.message,
            read_at: notification.read_at,
            created_at: notification.created_at
          }
        end
      }
    end

    def mark_notification_read
      notification = current_user.subscription_notifications.find(params[:id])
      notification.update!(read_at: Time.current)

      render json: { data: { id: notification.id, read_at: notification.read_at } }
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Notificação não encontrada" }, status: :not_found
    end

    private

    def set_subscription
      @subscription = current_user.current_subscription
      if @subscription.nil?
        render(json: { error: "Assinatura ativa não encontrada" }, status: :not_found)
        return
      end
    end

    def customer_data
      # Aceita tanto customer_data (novo) quanto customer (antigo) para compatibilidade
      data = params.fetch(:customer_data, params.fetch(:customer, {}))
      
      if data.is_a?(Hash)
        data.permit(:name, :document, :phone).to_h.symbolize_keys
      else
        {}
      end
    end

    def payment_data
      # Aceita tanto payment_data (novo) quanto payment (antigo) para compatibilidade
      data = params.fetch(:payment_data, params.fetch(:payment, {}))
      
      if data.is_a?(Hash)
        permitted = data.permit(:method, :number, :expiryMonth, :expiry_month, :expiryYear, :expiry_year, 
                                :ccv, :holderName, :holder_name, :brand, :last4, :token).to_h.symbolize_keys
        
        # Normaliza snake_case para camelCase (compatibilidade com Asaas)
        normalized = {}
        permitted.each do |key, value|
          normalized[key] = value
          # Se vier em camelCase, converte para snake_case internamente
          case key.to_s
          when 'expiryMonth'
            normalized[:expiry_month] = value
          when 'expiryYear'
            normalized[:expiry_year] = value
          when 'holderName'
            normalized[:holder_name] = value
          when 'ccv'
            normalized[:ccv] = value
          end
        end
        
        normalized
      else
        {}
      end
    end

    def serialize_subscription(subscription)
      {
        id: subscription.id,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          description: subscription.plan.description,
          duration_days: subscription.plan.duration_days,
          price_cents: subscription.plan.price_cents,
          features: subscription.plan.features_list
        },
        status: subscription.status,
        started_at: subscription.started_at,
        expires_at: subscription.expires_at,
        cancelled_at: subscription.cancelled_at,
        payment_method: {
          brand: subscription.payment_method_brand,
          last4: subscription.payment_method_last4
        },
        customer: {
          name: subscription.customer_name,
          document: subscription.customer_document,
          phone: subscription.customer_phone
        }
      }
    end
  end
end
