module Payments
  class MockProvider < BaseProvider
    def create_subscription(user:, plan:, payment_data:, customer_data:)
      {
        external_subscription_id: "mock_sub_#{SecureRandom.hex(8)}",
        provider: "mock",
        payment_method_brand: payment_data[:brand].presence || "visa",
        payment_method_last4: payment_data[:last4].presence || "4242",
        payment_method_token: payment_data[:token].presence || "mock_token_#{SecureRandom.hex(4)}",
        customer_name: customer_data[:name].presence || user.name,
        customer_document: customer_data[:document],
        customer_phone: customer_data[:phone],
        status: UserSubscription::STATUSES[:active],
        started_at: Time.current,
        expires_at: Time.current + plan.duration_days.days
      }
    end

    def update_payment_method(external_subscription_id:, payment_data:)
      {
        external_subscription_id: external_subscription_id,
        payment_method_brand: payment_data[:brand].presence || "visa",
        payment_method_last4: payment_data[:last4].presence || "4242",
        payment_method_token: payment_data[:token].presence || "mock_token_#{SecureRandom.hex(4)}"
      }
    end

    def cancel_subscription(external_subscription_id:)
      { external_subscription_id: external_subscription_id, cancelled_at: Time.current }
    end

    def renew_subscription(external_subscription_id:, plan:, payment_data:)
      {
        external_subscription_id: external_subscription_id,
        payment_method_brand: payment_data[:brand],
        payment_method_last4: payment_data[:last4],
        payment_method_token: payment_data[:token],
        expires_at: Time.current + plan.duration_days.days,
        status: UserSubscription::STATUSES[:active]
      }
    end
  end
end
