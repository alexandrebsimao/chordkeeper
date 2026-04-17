module Subscriptions
  class RenewalService
    def initialize
      @payment_provider = Payments::Factory.provider
    end

    def call(subscription)
      raise StandardError, "Assinatura inativa" unless subscription.active? || subscription.expired?
      raise StandardError, "Plano indisponível" unless subscription.plan.active?

      # Process payment through provider
      payment_result = process_payment(subscription)

      # Update subscription with new expiry date
      subscription.update!(
        expires_at: Time.current + subscription.plan.duration_days.days,
        status: :active,
        last_renewed_at: Time.current
      )

      # Create notification for successful renewal
      subscription.notifications.create!(
        title: "Assinatura Renovada",
        message: "Sua assinatura foi renovada com sucesso até #{subscription.expires_at.strftime('%d/%m/%Y')}"
      )

      subscription
    rescue StandardError => e
      # Log the error and notify the user
      subscription.update!(status: :renewal_failed) if subscription.respond_to?(:renewal_failed?)
      raise e
    end

    private

    def process_payment(subscription)
      @payment_provider.charge(
        customer_id: subscription.provider_customer_id,
        amount_cents: subscription.plan.price_cents,
        description: "Renovação de assinatura #{subscription.plan.name}"
      )
    end
  end
end
