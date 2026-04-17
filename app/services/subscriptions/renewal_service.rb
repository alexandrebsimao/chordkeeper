module Subscriptions
  class RenewalService
    # Tolerância de 10 dias para tentar renovar antes de fazer downgrade
    RENEWAL_TOLERANCE_DAYS = 10

    def initialize
      @payment_provider = Payments::ProviderFactory.build
    end

    # Tenta renovar assinatura com retry logic
    def call(subscription)
      raise StandardError, "Assinatura inativa" unless subscription.active? || subscription.expired?
      raise StandardError, "Plano indisponível" unless subscription.plan.active?

      # Log tentativa
      subscription.update!(renewal_attempts: subscription.renewal_attempts.to_i + 1)
      
      # Tenta fazer cobrança
      process_payment(subscription)
      
      # Se sucesso: estende expiração
      subscription.update!(
        expires_at: Time.current + subscription.plan.duration_days.days,
        status: :active,
        last_renewed_at: Time.current,
        renewal_failed_at: nil,
        renewal_attempts: 0,  # Reset tentativas após sucesso
        renewal_tolerance_ends_at: nil
      )

      # Notifica sucesso
      subscription.subscription_notifications.create!(
        kind: 'renewal_success',
        title: "✅ Assinatura Renovada",
        message: "Sua assinatura foi renovada com sucesso até #{subscription.expires_at.strftime('%d/%m/%Y')}"
      )

      Rails.logger.info "Assinatura #{subscription.id} renovada com sucesso"
      subscription
    rescue StandardError => e
      Rails.logger.error "Erro ao renovar assinatura #{subscription.id}: #{e.message}"
      handle_renewal_failure(subscription, e)
    end

    private

    # Tenta fazer a cobrança recorrente
    def process_payment(subscription)
      # Reconstrói dados de pagamento do token armazenado
      payment_data = {
        method: 'credit_card',
        token: subscription.payment_method_token,
        brand: subscription.payment_method_brand,
        last4: subscription.payment_method_last4
      }

      # Tenta cobrança via provider
      @payment_provider.renew_subscription(
        external_subscription_id: subscription.external_subscription_id,
        plan: subscription.plan,
        payment_data: payment_data
      )
    end

    # Gerencia falhas de renovação com tolerância de 10 dias
    def handle_renewal_failure(subscription, error)
      # Marca primeira falha
      if subscription.renewal_failed_at.blank?
        subscription.update!(
          renewal_failed_at: Time.current,
          renewal_tolerance_ends_at: Time.current + RENEWAL_TOLERANCE_DAYS.days,
          status: :past_due
        )

        # Notifica sobre falha
        subscription.subscription_notifications.create!(
          kind: 'renewal_failed',
          title: "⚠️ Erro ao Renovar Assinatura",
          message: "Não conseguimos processar o pagamento. Tentaremos novamente nos próximos 10 dias. Erro: #{error.message}"
        )

        Rails.logger.warn "Primeira falha de renovação para assinatura #{subscription.id}"
      else
        # Verifica se passou a tolerância
        if Time.current > subscription.renewal_tolerance_ends_at
          # Faz downgrade para free plan
          downgrade_to_free_plan(subscription, error)
        else
          # Ainda dentro da tolerância, apenas loga e notifica
          dias_restantes = ((subscription.renewal_tolerance_ends_at - Time.current) / 1.day).to_i
          
          subscription.subscription_notifications.create!(
            kind: 'renewal_retry',
            title: "🔄 Renovação em Tentativa",
            message: "Continuamos tentando renovar sua assinatura. Tentativas restantes: #{dias_restantes} dias. Verifique seu cartão."
          )

          Rails.logger.warn "Falha de renovação (tentativa #{subscription.renewal_attempts}) para assinatura #{subscription.id}"
        end
      end

      raise error
    end

    # Faz downgrade para plano gratuito após 10 dias sem sucesso
    def downgrade_to_free_plan(subscription, error)
      free_plan = Plan.find_by(name: 'Free') || Plan.find_by(price_cents: 0)
      
      if free_plan.blank?
        Rails.logger.error "Plano Free não encontrado para downgrade da assinatura #{subscription.id}"
        return
      end

      # Guarda plano anterior
      previous_plan_id = subscription.plan_id

      # Atualiza para plano free
      subscription.update!(
        plan_id: free_plan.id,
        status: :active,
        expires_at: nil,  # Plano free não expira
        renewal_failed_at: nil,
        renewal_tolerance_ends_at: nil,
        renewal_attempts: 0,
        downgraded_at: Time.current,
        previous_plan_id: previous_plan_id
      )

      # Notifica downgrade
      subscription.subscription_notifications.create!(
        kind: 'downgrade_to_free',
        title: "📉 Downgrade para Plano Gratuito",
        message: "Após 10 dias sem conseguir renovar o pagamento, sua assinatura foi rebaixada para o plano gratuito. Seu acesso aos recursos premium foi removido."
      )

      Rails.logger.warn "Assinatura #{subscription.id} downgraded para plano free após falha de renovação"
    end
  end
end
