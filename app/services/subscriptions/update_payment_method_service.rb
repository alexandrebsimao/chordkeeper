module Subscriptions
  class UpdatePaymentMethodService
    def initialize(subscription:, payment_data:, provider_name: nil, request_context: {})
      @subscription = subscription
      @payment_data = payment_data
      @provider = Payments::ProviderFactory.build(provider_name)
      @request_context = request_context # IP and user agent for security logging
    end

    def call
      raise StandardError, "Assinatura sem vínculo externo" if @subscription.external_subscription_id.blank?

      # Store old payment details for audit and notification
      old_brand = @subscription.payment_method_brand
      old_last4 = @subscription.payment_method_last4

      response = @provider.update_payment_method(
        external_subscription_id: @subscription.external_subscription_id,
        payment_data: @payment_data
      )

      @subscription.update!(
        payment_method_brand: response[:payment_method_brand],
        payment_method_last4: response[:payment_method_last4],
        payment_method_token: response[:payment_method_token]
      )

      # 🔒 SECURITY: Log audit and send notification email
      log_audit(old_brand, old_last4, response[:payment_method_brand], response[:payment_method_last4])
      notify_user(old_brand, old_last4, response[:payment_method_brand], response[:payment_method_last4])

      @subscription
    end

    private

    def log_audit(old_brand, old_last4, new_brand, new_last4)
      PaymentAuditLog.log_action(
        action: PaymentAuditLog::ACTIONS[:payment_method_updated],
        user: @subscription.user,
        subscription: @subscription,
        details: {
          old_brand: old_brand,
          old_last4: old_last4,
          new_brand: new_brand,
          new_last4: new_last4,
          timestamp: Time.current.iso8601
        },
        ip_address: @request_context[:ip_address],
        user_agent: @request_context[:user_agent]
      )
    end

    def notify_user(old_brand, old_last4, new_brand, new_last4)
      # 🔒 Send email notification
      SubscriptionMailer.payment_method_updated(
        @subscription.id,
        old_brand,
        old_last4,
        new_brand,
        new_last4,
        @request_context[:ip_address]
      ).deliver_later
    end
  end
end
