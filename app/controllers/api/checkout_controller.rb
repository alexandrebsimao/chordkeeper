module Api
  class CheckoutController < ApiController
    before_action :authenticate_user!

    # POST /api/checkout
    def create
      plan = Plan.find_by(id: params[:plan_id])
      
      unless plan&.active
        return render json: { error: 'Plano não disponível' }, status: :unprocessable_entity
      end

      # Free plan - ativar direto sem pagamento
      if plan.price_cents == 0
        activate_free_plan(plan)
        return
      end

      # Plano pago - criar checkout session do Stripe
      if Rails.env.production? && plan.external_price_id.blank?
        return render json: { error: 'Plano não configurado para pagamento' }, status: :unprocessable_entity
      end

      begin
        service = StripeCheckoutService.new(current_user, plan)
        
        frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:5173'
        session = service.create_checkout_session(
          success_url: "#{frontend_url}/checkout/success?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: "#{frontend_url}/plans?canceled=true"
        )

        render json: {
          checkout_url: session.url,
          session_id: session.id
        }, status: :ok
      rescue Stripe::StripeError => e
        Rails.logger.error "Stripe error: #{e.message}"
        render json: { error: 'Erro ao processar pagamento. Tente novamente.' }, status: :unprocessable_entity
      end
    end

    # GET /api/checkout/success
    def success
      session_id = params[:session_id]
      
      unless session_id
        return render json: { error: 'Session ID não fornecido' }, status: :bad_request
      end

      begin
        session = Stripe::Checkout::Session.retrieve(session_id)
        
        render json: {
          message: session.payment_status == 'paid' ? 'Pagamento confirmado!' : 'Aguardando confirmação',
          status: session.payment_status,
          customer_email: session.customer_email
        }, status: :ok
      rescue Stripe::StripeError => e
        Rails.logger.error "Stripe error: #{e.message}"
        render json: { error: 'Erro ao verificar pagamento' }, status: :unprocessable_entity
      end
    end

    # POST /api/checkout/portal
    def portal
      begin
        service = StripeCheckoutService.new(current_user, nil)
        frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:5173'
        
        session = service.create_customer_portal_session(
          return_url: "#{frontend_url}/plans"
        )

        render json: { portal_url: session.url }, status: :ok
      rescue => e
        Rails.logger.error "Portal error: #{e.message}"
        render json: { error: 'Não foi possível acessar o portal de gerenciamento' }, status: :unprocessable_entity
      end
    end

    private

    def activate_free_plan(plan)
      subscription = current_user.user_subscriptions.create!(
        plan: plan,
        status: 'active',
        started_at: Time.current,
        expires_at: nil, # Free plan nunca expira
        payment_provider: 'free'
      )

      render json: {
        message: 'Plano Free ativado com sucesso',
        subscription: {
          id: subscription.id,
          plan_name: plan.name,
          status: subscription.status
        }
      }, status: :created
    end
  end
end
