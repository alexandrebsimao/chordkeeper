class SubscriptionChangeService
  def initialize(user, new_plan)
    @user = user
    @new_plan = new_plan
    @current_subscription = user.active_subscription
  end

  def change_plan
    # Se não tem subscription ativa, criar nova
    return create_new_subscription unless @current_subscription

    # Se não tem external_subscription_id, criar nova
    return create_new_subscription unless @current_subscription.external_subscription_id

    # Se é plano free, apenas criar nova subscription local
    if @new_plan.price_cents == 0
      return activate_free_plan
    end

    # Atualizar subscription existente no Stripe
    update_stripe_subscription
  end

  private

  def create_new_subscription
    # Para plano free
    if @new_plan.price_cents == 0
      return activate_free_plan
    end

    # Para plano pago, precisa passar pelo checkout
    raise 'Need checkout session for new paid subscription'
  end

  def activate_free_plan
    @user.user_subscriptions.create!(
      plan: @new_plan,
      status: 'active',
      started_at: Time.current,
      expires_at: nil,
      payment_provider: 'free'
    )
  end

  def update_stripe_subscription
    # Buscar subscription no Stripe
    stripe_subscription = Stripe::Subscription.retrieve(
      @current_subscription.external_subscription_id
    )

    # Atualizar com novo plano (com proration automática)
    updated_subscription = Stripe::Subscription.update(
      stripe_subscription.id,
      {
        items: [{
          id: stripe_subscription.items.data[0].id,
          price: @new_plan.external_price_id,
        }],
        proration_behavior: 'create_prorations', # Stripe calcula crédito/débito
        billing_cycle_anchor: 'unchanged' # Mantém data de renovação
      }
    )

    # Atualizar no banco
    @current_subscription.update!(
      plan: @new_plan,
      expires_at: Time.at(updated_subscription.current_period_end)
    )

    @current_subscription
  end
end
