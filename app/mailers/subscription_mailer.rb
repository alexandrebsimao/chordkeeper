class SubscriptionMailer < ApplicationMailer
  def expiry_reminder(subscription_id, notification_id)
    @subscription = UserSubscription.includes(:user, :plan).find(subscription_id)
    @notification = SubscriptionNotification.find(notification_id)
    @user = @subscription.user
    @plan = @subscription.plan

    mail(to: @user.email, subject: @notification.title)
  end

  # 🔒 SECURITY: Notify user when payment method is changed
  def payment_method_updated(subscription_id, old_brand, old_last4, new_brand, new_last4, ip_address)
    @subscription = UserSubscription.includes(:user, :plan).find(subscription_id)
    @user = @subscription.user
    @plan = @subscription.plan
    @old_brand = old_brand
    @old_last4 = old_last4
    @new_brand = new_brand
    @new_last4 = new_last4
    @ip_address = ip_address
    @timestamp = Time.current.strftime("%d/%m/%Y às %H:%M")

    subject = "🔒 Seu método de pagamento foi atualizado"
    mail(to: @user.email, subject: subject)
  end

  # 🔒 SECURITY: Suspicious activity detection
  def suspicious_login_attempt(user_id, ip_address, user_agent)
    @user = User.find(user_id)
    @ip_address = ip_address
    @user_agent = user_agent
    @timestamp = Time.current.strftime("%d/%m/%Y às %H:%M")

    subject = "⚠️ Atividade suspeita detectada em sua conta"
    mail(to: @user.email, subject: subject)
  end
end
