module Subscriptions
  class ExpiryNotificationService
    REMINDER_DAYS = [7, 3, 1].freeze

    def call
      UserSubscription.active.includes(:user, :plan).find_each do |subscription|
        days_to_expiry = subscription.expires_in_days
        next unless REMINDER_DAYS.include?(days_to_expiry)

        next if already_notified?(subscription, days_to_expiry)

        notification = SubscriptionNotification.create!(
          user: subscription.user,
          user_subscription: subscription,
          kind: "expiry_reminder",
          title: "Sua assinatura vence em #{days_to_expiry} dia(s)",
          message: "O plano #{subscription.plan.name} vence em #{days_to_expiry} dia(s). Renove para manter acesso.",
          scheduled_for: Time.current,
          sent_at: Time.current,
          metadata: { days_to_expiry: days_to_expiry }
        )

        SubscriptionMailer.expiry_reminder(subscription.id, notification.id).deliver_later
      end
    end

    private

    def already_notified?(subscription, days_to_expiry)
      subscription.subscription_notifications.where(kind: "expiry_reminder").where("metadata ->> 'days_to_expiry' = ?", days_to_expiry.to_s).exists?
    end
  end
end
