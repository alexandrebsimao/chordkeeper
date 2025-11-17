class StripeCheckoutService
  def initialize(user, plan)
    @user = user
    @plan = plan
  end

  def create_checkout_session(success_url:, cancel_url:)
    # Criar ou obter customer
    customer = find_or_create_customer

    # Criar checkout session
    session = Stripe::Checkout::Session.create(
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: @plan.external_price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        user_id: @user.id,
        plan_id: @plan.id
      },
      subscription_data: {
        metadata: {
          user_id: @user.id,
          plan_id: @plan.id
        }
      }
    )

    session
  end

  def create_customer_portal_session(return_url:)
    subscription = @user.active_subscription
    
    raise 'No active subscription' unless subscription&.external_customer_id

    Stripe::BillingPortal::Session.create(
      customer: subscription.external_customer_id,
      return_url: return_url
    )
  end

  private

  def find_or_create_customer
    subscription = @user.user_subscriptions.order(created_at: :desc).first
    
    if subscription&.external_customer_id
      begin
        Stripe::Customer.retrieve(subscription.external_customer_id)
      rescue Stripe::InvalidRequestError
        create_new_customer
      end
    else
      create_new_customer
    end
  end

  def create_new_customer
    Stripe::Customer.create(
      email: @user.email,
      metadata: {
        user_id: @user.id
      }
    )
  end
end
