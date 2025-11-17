module Webhooks
  class StripeController < ApplicationController
    skip_before_action :verify_authenticity_token
    before_action :verify_signature

    # POST /webhooks/stripe
    def create
      event = @stripe_event

      case event.type
      when 'checkout.session.completed'
        handle_checkout_completed(event.data.object)
      when 'customer.subscription.created'
        handle_subscription_created(event.data.object)
      when 'customer.subscription.updated'
        handle_subscription_updated(event.data.object)
      when 'customer.subscription.deleted'
        handle_subscription_deleted(event.data.object)
      when 'invoice.payment_succeeded'
        handle_payment_succeeded(event.data.object)
      when 'invoice.payment_failed'
        handle_payment_failed(event.data.object)
      end

      head :ok
    rescue => e
      Rails.logger.error "Webhook error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      head :ok # Sempre retornar 200 para não retrigar webhook
    end

    private

    def verify_signature
      payload = request.body.read
      sig_header = request.headers['Stripe-Signature']
      webhook_secret = ENV['STRIPE_WEBHOOK_SECRET']

      unless webhook_secret
        Rails.logger.error "STRIPE_WEBHOOK_SECRET not configured"
        return head :bad_request
      end

      begin
        @stripe_event = Stripe::Webhook.construct_event(
          payload, sig_header, webhook_secret
        )
      rescue JSON::ParserError => e
        Rails.logger.error "Webhook JSON parse error: #{e.message}"
        head :bad_request
      rescue Stripe::SignatureVerificationError => e
        Rails.logger.error "Webhook signature verification failed: #{e.message}"
        head :bad_request
      end
    end

    def handle_checkout_completed(session)
      user_id = session.metadata['user_id']
      plan_id = session.metadata['plan_id']
      
      user = User.find_by(id: user_id)
      plan = Plan.find_by(id: plan_id)
      
      unless user && plan
        Rails.logger.error "User or Plan not found: user_id=#{user_id}, plan_id=#{plan_id}"
        return
      end

      # Criar assinatura
      subscription = user.user_subscriptions.create!(
        plan: plan,
        status: 'active',
        started_at: Time.current,
        expires_at: calculate_expiration(plan.interval),
        payment_provider: 'stripe',
        external_subscription_id: session.subscription,
        external_customer_id: session.customer
      )

      Rails.logger.info "Subscription created: user_id=#{user.id}, subscription_id=#{subscription.id}"
      
      # TODO: Enviar email de boas-vindas
      # UserMailer.subscription_activated(user, subscription).deliver_later
    end

    def handle_subscription_created(stripe_subscription)
      user_id = stripe_subscription.metadata['user_id']
      plan_id = stripe_subscription.metadata['plan_id']
      
      user = User.find_by(id: user_id)
      plan = Plan.find_by(id: plan_id)
      
      return unless user && plan

      # Verificar se já existe
      existing = UserSubscription.find_by(external_subscription_id: stripe_subscription.id)
      return if existing

      user.user_subscriptions.create!(
        plan: plan,
        status: 'active',
        started_at: Time.current,
        expires_at: calculate_expiration(plan.interval),
        payment_provider: 'stripe',
        external_subscription_id: stripe_subscription.id,
        external_customer_id: stripe_subscription.customer
      )
    end

    def handle_subscription_updated(stripe_subscription)
      subscription = UserSubscription.find_by(external_subscription_id: stripe_subscription.id)
      return unless subscription

      # Mapear status do Stripe para nosso status
      new_status = case stripe_subscription.status
      when 'active', 'trialing'
        'active'
      when 'canceled'
        'cancelled'
      when 'past_due', 'unpaid', 'incomplete', 'incomplete_expired'
        'expired'
      else
        subscription.status
      end

      subscription.update!(status: new_status)
      Rails.logger.info "Subscription updated: id=#{subscription.id}, status=#{new_status}"
    end

    def handle_subscription_deleted(stripe_subscription)
      subscription = UserSubscription.find_by(external_subscription_id: stripe_subscription.id)
      return unless subscription

      subscription.cancel!
      Rails.logger.info "Subscription cancelled: id=#{subscription.id}"
      
      # TODO: Enviar email de cancelamento
      # UserMailer.subscription_cancelled(subscription.user, subscription).deliver_later
    end

    def handle_payment_succeeded(invoice)
      return unless invoice.subscription # Só processar se for de assinatura

      subscription = UserSubscription.find_by(external_subscription_id: invoice.subscription)
      return unless subscription

      # Renovar assinatura
      new_expiration = calculate_expiration(subscription.plan.interval)
      subscription.update!(
        status: 'active',
        expires_at: new_expiration
      )

      Rails.logger.info "Payment succeeded: subscription_id=#{subscription.id}, amount=#{invoice.amount_paid}"
      
      # TODO: Enviar email de confirmação
      # UserMailer.payment_succeeded(subscription.user, subscription).deliver_later
    end

    def handle_payment_failed(invoice)
      return unless invoice.subscription

      subscription = UserSubscription.find_by(external_subscription_id: invoice.subscription)
      return unless subscription

      Rails.logger.warn "Payment failed: subscription_id=#{subscription.id}, amount=#{invoice.amount_due}"
      
      # TODO: Enviar email de falha no pagamento
      # UserMailer.payment_failed(subscription.user, subscription).deliver_later
    end

    def calculate_expiration(interval)
      case interval
      when 'month'
        1.month.from_now
      when 'year'
        1.year.from_now
      else
        1.month.from_now
      end
    end
  end
end
