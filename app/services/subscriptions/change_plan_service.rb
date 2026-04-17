module Subscriptions
  class ChangePlanService
    def initialize(subscription:, new_plan:)
      @subscription = subscription
      @new_plan = new_plan
    end

    def call
      raise StandardError, "Assinatura inativa" unless @subscription.active?
      raise StandardError, "Plano indisponível" unless @new_plan.active?

      @subscription.update!(
        plan: @new_plan,
        expires_at: Time.current + @new_plan.duration_days.days
      )

      @subscription
    end
  end
end
