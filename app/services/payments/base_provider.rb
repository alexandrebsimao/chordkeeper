module Payments
  class BaseProvider
    ProviderError = Class.new(StandardError)

    def create_subscription(_user:, _plan:, _payment_data:, _customer_data:)
      raise NotImplementedError
    end

    def update_payment_method(_external_subscription_id:, _payment_data:)
      raise NotImplementedError
    end

    def cancel_subscription(_external_subscription_id:)
      raise NotImplementedError
    end

    def renew_subscription(_external_subscription_id:, _plan:, _payment_data:)
      raise NotImplementedError
    end
  end
end
