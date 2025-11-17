class SubscriptionStatusChecker
  def self.sync_all
    Rails.logger.info "Starting subscription sync..."
    
    synced = 0
    errors = 0
    
    UserSubscription.where(payment_provider: 'stripe')
                   .where.not(external_subscription_id: nil)
                   .find_each do |subscription|
      sync_subscription(subscription)
      synced += 1
    rescue => e
      Rails.logger.error "Error syncing subscription #{subscription.id}: #{e.message}"
      errors += 1
    end
    
    Rails.logger.info "Sync complete: #{synced} synced, #{errors} errors"
  end
  
  def self.sync_subscription(subscription)
    stripe_sub = Stripe::Subscription.retrieve(
      subscription.external_subscription_id
    )
    
    # Atualizar status e data de expiração
    subscription.update!(
      status: map_stripe_status(stripe_sub.status),
      expires_at: Time.at(stripe_sub.current_period_end)
    )
    
    Rails.logger.info "Synced subscription #{subscription.id}: status=#{stripe_sub.status}"
    
  rescue Stripe::InvalidRequestError => e
    # Subscription não existe mais no Stripe
    Rails.logger.error "Subscription not found in Stripe: #{e.message}"
    subscription.cancel! if subscription.active?
  end
  
  private
  
  def self.map_stripe_status(stripe_status)
    case stripe_status
    when 'active', 'trialing'
      'active'
    when 'past_due'
      'payment_failed'
    when 'canceled', 'unpaid', 'incomplete_expired'
      'cancelled'
    else
      'expired'
    end
  end
end
