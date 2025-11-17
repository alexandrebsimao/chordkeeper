module Api
  class SubscriptionsController < ApiController
    before_action :authenticate_user!

    # POST /api/subscriptions
    def create
      plan = Plan.find_by(id: params[:plan_id])
      
      unless plan
        return render json: { error: 'Plano não encontrado' }, status: :not_found
      end

      unless plan.active
        return render json: { error: 'Plano não está disponível' }, status: :unprocessable_entity
      end

      # Create subscription
      subscription = current_user.user_subscriptions.new(
        plan: plan,
        status: 'active',
        started_at: Time.current,
        expires_at: calculate_expiration(plan.interval),
        payment_provider: 'manual'
      )

      if subscription.save
        render json: {
          message: 'Assinatura criada com sucesso',
          subscription: {
            id: subscription.id,
            plan_name: plan.name,
            status: subscription.status,
            started_at: subscription.started_at,
            expires_at: subscription.expires_at,
            days_remaining: subscription.days_remaining
          }
        }, status: :created
      else
        render json: {
          error: 'Erro ao criar assinatura',
          errors: subscription.errors.full_messages
        }, status: :unprocessable_entity
      end
    end

    # GET /api/subscriptions/current
    def current
      subscription = current_user.active_subscription

      if subscription
        render json: {
          id: subscription.id,
          plan_name: subscription.plan.name,
          status: subscription.status,
          started_at: subscription.started_at,
          expires_at: subscription.expires_at,
          days_remaining: subscription.days_remaining,
          plan: {
            id: subscription.plan.id,
            name: subscription.plan.name,
            price_cents: subscription.plan.price_cents,
            interval: subscription.plan.interval,
            formatted_price: subscription.plan.formatted_price
          }
        }, status: :ok
      else
        render json: {
          message: 'Nenhuma assinatura ativa',
          plan_name: 'Free'
        }, status: :ok
      end
    end

    # DELETE /api/subscriptions/cancel
    def cancel
      subscription = current_user.active_subscription

      unless subscription
        return render json: { error: 'Nenhuma assinatura ativa para cancelar' }, status: :not_found
      end

      # Se for plano free, apenas cancelar localmente
      if subscription.payment_provider == 'free'
        subscription.cancel!
        return render json: {
          message: 'Plano free cancelado',
          subscription: { id: subscription.id, status: subscription.status }
        }, status: :ok
      end

      # Se tiver external_subscription_id, cancelar no Stripe
      if subscription.external_subscription_id
        begin
          # Cancelar no final do período (usuário mantém acesso até expirar)
          Stripe::Subscription.update(
            subscription.external_subscription_id,
            cancel_at_period_end: true
          )

          subscription.update!(cancelled_at: Time.current)

          render json: {
            message: "Assinatura cancelada. Você terá acesso até #{subscription.expires_at&.strftime('%d/%m/%Y')}",
            subscription: {
              id: subscription.id,
              status: subscription.status,
              cancelled_at: subscription.cancelled_at,
              expires_at: subscription.expires_at
            }
          }, status: :ok
        rescue Stripe::StripeError => e
          render json: { error: "Erro ao cancelar no Stripe: #{e.message}" }, status: :unprocessable_entity
        end
      else
        # Cancelar apenas localmente
        subscription.cancel!
        render json: {
          message: 'Assinatura cancelada',
          subscription: { id: subscription.id, status: subscription.status }
        }, status: :ok
      end
    end

    # POST /api/subscriptions/reactivate
    def reactivate
      subscription = current_user.user_subscriptions
                                .where(cancelled_at: nil..)
                                .order(created_at: :desc)
                                .first

      unless subscription
        return render json: { error: 'Nenhuma assinatura para reativar' }, status: :not_found
      end

      if subscription.external_subscription_id
        begin
          # Remover cancelamento agendado no Stripe
          Stripe::Subscription.update(
            subscription.external_subscription_id,
            cancel_at_period_end: false
          )

          subscription.update!(
            status: 'active',
            cancelled_at: nil
          )

          render json: {
            message: 'Assinatura reativada com sucesso!',
            subscription: {
              id: subscription.id,
              status: subscription.status,
              expires_at: subscription.expires_at
            }
          }, status: :ok
        rescue Stripe::StripeError => e
          render json: { error: "Erro ao reativar: #{e.message}" }, status: :unprocessable_entity
        end
      else
        render json: { error: 'Assinatura não pode ser reativada' }, status: :unprocessable_entity
      end
    end

    private

    def calculate_expiration(interval)
      case interval
      when 'month'
        1.month.from_now
      when 'year'
        1.year.from_now
      else
        1.month.from_now
      end
    end
  end
end
