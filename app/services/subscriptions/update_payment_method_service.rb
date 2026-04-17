module Subscriptions
  class UpdatePaymentMethodService
    def initialize(subscription:, payment_data:, provider_name: nil)
      @subscription = subscription
      @payment_data = payment_data
      @provider = Payments::ProviderFactory.build(provider_name)
    end

    def call
      raise StandardError, "Assinatura sem vínculo externo" if @subscription.external_subscription_id.blank?

      response = @provider.update_payment_method(
        external_subscription_id: @subscription.external_subscription_id,
        payment_data: @payment_data
      )

      @subscription.update!(
        payment_method_brand: response[:payment_method_brand],
        payment_method_last4: response[:payment_method_last4],
        payment_method_token: response[:payment_method_token]
      )

      @subscription
    end
  end
end
