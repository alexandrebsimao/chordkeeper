module Subscriptions
  class CancelService
    def initialize(subscription:, provider_name: nil)
      @subscription = subscription
      @provider = Payments::ProviderFactory.build(provider_name)
    end

    def call
      if @subscription.external_subscription_id.present?
        @provider.cancel_subscription(external_subscription_id: @subscription.external_subscription_id)
      end

      @subscription.mark_cancelled!
      @subscription
    end
  end
end
