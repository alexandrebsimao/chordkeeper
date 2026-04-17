module Subscriptions
  class CreateService
    def initialize(user:, plan:, customer_data:, payment_data:, provider_name: nil)
      @user = user
      @plan = plan
      @customer_data = customer_data
      @payment_data = payment_data
      @provider = Payments::ProviderFactory.build(provider_name)
    end

    def call
      raise StandardError, "Plano indisponível" unless @plan.active?

      ActiveRecord::Base.transaction do
        current_subscription = @user.current_subscription
        current_subscription&.mark_cancelled!

        payment_response = @provider.create_subscription(
          user: @user,
          plan: @plan,
          customer_data: @customer_data,
          payment_data: @payment_data
        )

        UserSubscription.create!(
          user: @user,
          plan: @plan,
          status: payment_response[:status],
          started_at: payment_response[:started_at],
          expires_at: payment_response[:expires_at],
          payment_provider: payment_response[:provider],
          external_subscription_id: payment_response[:external_subscription_id],
          customer_name: payment_response[:customer_name],
          customer_document: payment_response[:customer_document],
          customer_phone: payment_response[:customer_phone],
          payment_method_brand: payment_response[:payment_method_brand],
          payment_method_last4: payment_response[:payment_method_last4],
          payment_method_token: payment_response[:payment_method_token]
        )
      end
    end
  end
end
