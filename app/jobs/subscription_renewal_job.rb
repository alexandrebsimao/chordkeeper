class SubscriptionRenewalJob < ApplicationJob
  queue_as :default

  def perform
    # Find expired subscriptions that should be auto-renewed
    expired_subscriptions = UserSubscription
      .where(status: :active, auto_renew: true)
      .where("expires_at <= ?", Time.current)

    expired_subscriptions.each do |subscription|
      renew_subscription(subscription)
    end

    Rails.logger.info "SubscriptionRenewalJob: Renewed #{expired_subscriptions.count} subscriptions"
  end

  private

  def renew_subscription(subscription)
    begin
      Subscriptions::RenewalService.new.call(subscription)
    rescue StandardError => e
      Rails.logger.error "Failed to renew subscription #{subscription.id}: #{e.message}"
      # Continue processing other subscriptions
    end
  end
end
