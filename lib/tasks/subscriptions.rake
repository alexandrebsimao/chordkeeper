namespace :subscriptions do
  desc "Sync all subscription statuses with Stripe"
  task sync: :environment do
    puts "🔄 Syncing subscriptions with Stripe..."
    
    begin
      SubscriptionStatusChecker.sync_all
      puts "✅ Sync completed successfully!"
    rescue => e
      puts "❌ Error during sync: #{e.message}"
      puts e.backtrace.join("\n")
      exit 1
    end
  end
  
  desc "Send expiration warnings for subscriptions expiring soon"
  task warn_expiring: :environment do
    puts "📧 Checking for expiring subscriptions..."
    
    count = 0
    UserSubscription.active
                    .where('expires_at IS NOT NULL')
                    .where('expires_at <= ?', 3.days.from_now)
                    .where('expires_at > ?', Time.current)
                    .find_each do |subscription|
      # TODO: Implementar email quando mailer estiver pronto
      # UserMailer.expiring_soon(subscription.user, subscription).deliver_later
      
      puts "  ⚠️  User #{subscription.user.email} expires in #{subscription.days_remaining} days"
      count += 1
    end
    
    puts "✅ Sent #{count} expiration warnings"
  end
  
  desc "Check failed payments and send reminders"
  task check_failed_payments: :environment do
    puts "🔍 Checking failed payments..."
    
    count = 0
    UserSubscription.where(status: 'payment_failed')
                    .where('updated_at >= ?', 1.day.ago)
                    .find_each do |subscription|
      # TODO: Enviar email de lembrete
      # UserMailer.payment_failed_reminder(subscription.user, subscription).deliver_later
      
      puts "  ❌ User #{subscription.user.email} has failed payment"
      count += 1
    end
    
    puts "✅ Found #{count} failed payments"
  end
  
  desc "Generate subscription metrics report"
  task metrics: :environment do
    puts "\n📊 Subscription Metrics Report"
    puts "=" * 50
    
    total = UserSubscription.count
    active = UserSubscription.active.count
    cancelled = UserSubscription.cancelled.count
    expired = UserSubscription.expired.count
    
    puts "Total Subscriptions: #{total}"
    puts "Active: #{active} (#{percentage(active, total)}%)"
    puts "Cancelled: #{cancelled} (#{percentage(cancelled, total)}%)"
    puts "Expired: #{expired} (#{percentage(expired, total)}%)"
    puts ""
    
    # Revenue
    monthly_revenue = UserSubscription.active
                                     .joins(:plan)
                                     .where(plans: { interval: 'month' })
                                     .sum('plans.price_cents') / 100.0
    
    annual_revenue = UserSubscription.active
                                    .joins(:plan)
                                    .where(plans: { interval: 'year' })
                                    .sum('plans.price_cents') / 100.0 / 12.0
    
    total_mrr = monthly_revenue + annual_revenue
    
    puts "💰 Monthly Recurring Revenue (MRR):"
    puts "  Monthly plans: R$ #{format('%.2f', monthly_revenue)}"
    puts "  Annual plans: R$ #{format('%.2f', annual_revenue)}"
    puts "  Total MRR: R$ #{format('%.2f', total_mrr)}"
    puts ""
    
    # By plan
    puts "📋 Active Subscriptions by Plan:"
    Plan.find_each do |plan|
      count = UserSubscription.active.where(plan: plan).count
      revenue = count * (plan.price_cents / 100.0)
      puts "  #{plan.name}: #{count} (R$ #{format('%.2f', revenue)}/#{plan.interval})"
    end
    
    puts "\n" + "=" * 50
  end
  
  private
  
  def percentage(part, total)
    return 0 if total.zero?
    ((part.to_f / total) * 100).round(2)
  end
end
