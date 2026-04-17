class SubscriptionRenewalJob < ApplicationJob
  queue_as :default

  # Dias antes da expir action para começar renovação
  RENEWAL_DAYS_BEFORE_EXPIRY = 1

  def perform
    # Encontra assinaturas que expiram em breve ou já expiraram
    renewal_window_start = Time.current
    renewal_window_end = Time.current + RENEWAL_DAYS_BEFORE_EXPIRY.days

    # Assinaturas que expiram amanhã ou já expiraram
    subscriptions_to_renew = UserSubscription
      .where(status: [:active, :past_due], auto_renew: true)
      .where("expires_at <= ?", renewal_window_end)
      .where("expires_at >= ? OR status = ?", renewal_window_start, :past_due)

    Rails.logger.info "SubscriptionRenewalJob: Encontradas #{subscriptions_to_renew.count} assinaturas para renovar"

    subscriptions_to_renew.each do |subscription|
      begin
        Rails.logger.info "Iniciando renovação de assinatura #{subscription.id} (expira em #{subscription.expires_in_days} dias)"
        renew_subscription(subscription)
      rescue StandardError => e
        Rails.logger.error "Erro ao renovar assinatura #{subscription.id}: #{e.message}"
        # Continua processando outras assinaturas
      end
    end

    Rails.logger.info "SubscriptionRenewalJob: Concluído. Processadas #{subscriptions_to_renew.count} assinaturas"
  end

  private

  def renew_subscription(subscription)
    Subscriptions::RenewalService.new.call(subscription)
  rescue StandardError => e
    # Erro já foi logado e tratado em RenewalService
    # Apenas re-raise para o job saber que tentamos
    raise e
  end
end
