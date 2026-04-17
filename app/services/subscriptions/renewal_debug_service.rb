module Subscriptions
  class RenewalDebugService
    # Service auxiliar para testar e debugar renovações
    
    def initialize
      @renewal_service = RenewalService.new
    end

    # Força renovação imediata de uma assinatura
    def force_renew(subscription)
      puts "🔄 Forçando renovação de assinatura #{subscription.id}..."
      @renewal_service.call(subscription)
      puts "✅ Renovação concluída"
    rescue StandardError => e
      puts "❌ Erro ao renovar: #{e.message}"
      subscription.reload
      puts "Status atual: #{subscription.status}"
      puts "Tentativas: #{subscription.renewal_attempts}"
      puts "Falha desde: #{subscription.renewal_failed_at}"
      puts "Tolerância acaba em: #{subscription.renewal_tolerance_ends_at}"
    end

    # Simula passagem de dias para testar lógica
    def simulate_days_passed(subscription, days)
      puts "⏰ Simulando #{days} dias passados para assinatura #{subscription.id}..."
      
      # Avança renewal_failed_at
      subscription.update!(
        renewal_failed_at: subscription.renewal_failed_at - days.days if subscription.renewal_failed_at.present?
      ) if subscription.renewal_failed_at.present?

      # Avança renewal_tolerance_ends_at
      subscription.update!(
        renewal_tolerance_ends_at: subscription.renewal_tolerance_ends_at - days.days
      ) if subscription.renewal_tolerance_ends_at.present?

      # Avança expires_at
      subscription.update!(
        expires_at: subscription.expires_at - days.days
      ) if subscription.expires_at.present?

      puts "✅ Simulação concluída. Nova data de expiração: #{subscription.expires_at}"
    end

    # Mostra status completo de uma assinatura
    def show_status(subscription)
      subscription.reload
      
      puts "\n📊 Status da Assinatura #{subscription.id}"
      puts "=" * 60
      puts "Usuário: #{subscription.user.email}"
      puts "Plano: #{subscription.plan.name} (#{subscription.plan.price_cents / 100.0})"
      puts "Status: #{subscription.status}"
      puts "Ativo? #{subscription.active? ? '✅' : '❌'}"
      puts "Downgraded? #{subscription.downgraded? ? '✅' : '❌'}"
      puts ""
      puts "Renovação:"
      puts "  Auto-renew: #{subscription.auto_renew ? '✅' : '❌'}"
      puts "  Tentativas: #{subscription.renewal_attempts}"
      puts "  Última renovação: #{subscription.last_renewed_at&.strftime('%d/%m/%Y %H:%M')}"
      puts "  Exp ira em: #{subscription.expires_in_days} dias (#{subscription.expires_at&.strftime('%d/%m/%Y')})"
      puts ""
      puts "Falhas:"
      puts "  Primeira falha: #{subscription.renewal_failed_at&.strftime('%d/%m/%Y %H:%M')}"
      puts "  Tolerância acaba: #{subscription.renewal_tolerance_ends_at&.strftime('%d/%m/%Y %H:%M')}"
      puts "  Dias restantes na tolerância: #{subscription.renewal_tolerance_ends_in_days}"
      puts ""
      puts "Downgrade:"
      puts "  Downgraded em: #{subscription.downgraded_at&.strftime('%d/%m/%Y %H:%M')}"
      puts "  Plano anterior: #{subscription.previous_plan&.name}"
      puts ""
      puts "Pagamento:"
      puts "  Método: #{subscription.payment_method_brand&.upcase} ****#{subscription.payment_method_last4}"
      puts "  Provider: #{subscription.payment_provider}"
      puts "  External ID: #{subscription.external_subscription_id}"
      puts "=" * 60 + "\n"
    end

    # Lista assinaturas pendentes de renovação
    def list_pending_renewals
      puts "\n📋 Assinaturas Pendentes de Renovação"
      puts "=" * 60

      # Próximas a expirar
      expires_soon = UserSubscription.expires_soon(1)
      if expires_soon.any?
        puts "\n🟡 Expirando em breve (1 dia):"
        expires_soon.each do |sub|
          puts "  - #{sub.user.email}: #{sub.plan.name} (expira em #{sub.expires_in_days} dias)"
        end
      end

      # Em tolerância
      in_tolerance = UserSubscription.in_renewal_tolerance
      if in_tolerance.any?
        puts "\n🟠 Em tolerância (renovação falhando):"
        in_tolerance.each do |sub|
          puts "  - #{sub.user.email}: #{sub.plan.name} (#{sub.renewal_attempts} tentativas, #{sub.renewal_tolerance_ends_in_days} dias restantes)"
        end
      end

      # Tolerância expirada
      tolerance_expired = UserSubscription.renewal_tolerance_expired
      if tolerance_expired.any?
        puts "\n🔴 Tolerância expirada (deve fazer downgrade):"
        tolerance_expired.each do |sub|
          puts "  - #{sub.user.email}: #{sub.plan.name} (#{sub.renewal_attempts} tentativas)"
        end
      end

      puts "\n" + "=" * 60 + "\n"
    end

    # Processa todas as assinaturas pendentes (como o job faria)
    def process_all_pending
      puts "\n🔄 Processando todas as assinaturas pendentes..."
      puts "=" * 60

      count = 0
      UserSubscription.where(status: [:active, :past_due], auto_renew: true).each do |subscription|
        next unless should_process?(subscription)
        
        count += 1
        puts "\n[#{count}] Processando #{subscription.user.email} (#{subscription.plan.name})"
        
        begin
          @renewal_service.call(subscription)
          puts "  ✅ Sucesso!"
        rescue StandardError => e
          puts "  ❌ Erro: #{e.message}"
        end
      end

      puts "\n" + "=" * 60
      puts "Processadas #{count} assinaturas"
      puts "=" * 60 + "\n"
    end

    private

    def should_process?(subscription)
      return false if subscription.renewal_failed_at.present? && 
                      subscription.renewal_tolerance_ends_at.nil?

      true
    end
  end
end
