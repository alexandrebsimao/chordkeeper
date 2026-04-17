class SubscriptionMailer < ApplicationMailer
  def expiry_reminder(subscription_id, notification_id)
    @subscription = UserSubscription.includes(:user, :plan).find(subscription_id)
    @notification = SubscriptionNotification.find(notification_id)
    @user = @subscription.user
    @plan = @subscription.plan

    mail(to: @user.email, subject: @notification.title)
  end
end
