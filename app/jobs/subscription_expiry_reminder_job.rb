class SubscriptionExpiryReminderJob < ApplicationJob
  queue_as :default

  def perform
    Subscriptions::ExpiryNotificationService.new.call
  end
end
