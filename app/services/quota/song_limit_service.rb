module Quota
  # Serviço para gerenciar limite de cifras por plano
  # 
  # Uso:
  #   quota = Quota::SongLimitService.new(current_user)
  #   quota.can_create?       # => true/false
  #   quota.status            # => { plan, limit, used, available, percentage, can_create }
  #   quota.error_message     # => string descritivo do erro
  #
  class SongLimitService
    # Define limite de cifras por plano
    # nil = ilimitado
    PLAN_LIMITS = {
      "Free" => 10,
      "Basic" => 50,
      "Premium" => 100,
      "Professional" => nil  # Ilimitado
    }.freeze

    def initialize(user)
      @user = user
      @plan = user.current_subscription&.plan
    end

    # ============================================================================
    # Limites e Quotas
    # ============================================================================

    # Limite em números ou nil se ilimitado
    def limit
      return nil if @plan.nil?
      PLAN_LIMITS[@plan.name]
    end

    # Label formatado do limite
    # Ex: "10 cifras", "Ilimitado"
    def limit_label
      limit.nil? ? "Ilimitado" : "#{limit} cifra(s)"
    end

    # ============================================================================
    # Uso Atual
    # ============================================================================

    # Quantas cifras o usuário criou
    def songs_count
      @user.owned_libraries.joins(:songs).count(:songs, distinct: true)
    end

    # Quantas mais pode criar
    def available_count
      return Float::INFINITY if limit.nil?
      [limit - songs_count, 0].max
    end

    # Percentual usado (0-100)
    def usage_percentage
      return 0.0 if limit.nil?
      ((songs_count.to_f / limit) * 100).round(2)
    end

    # ============================================================================
    # Validações
    # ============================================================================

    # Pode criar mais uma cifra?
    def can_create?
      return true if limit.nil?
      songs_count < limit
    end

    # Está perto do limite? (80% ou mais)
    def near_limit?
      return false if limit.nil?
      usage_percentage >= 80
    end

    # Atingiu o limite?
    def at_limit?
      return false if limit.nil?
      songs_count >= limit
    end

    # ============================================================================
    # Mensagens
    # ============================================================================

    # Mensagem de erro se não pode criar
    def error_message
      if @plan.nil?
        "Você precisa ter uma assinatura ativa para criar cifras."
      elsif at_limit?
        "Você atingiu o limite de #{limit_label} do plano #{@plan.name}. " \
        "Tem #{songs_count} cifra(s). Para criar mais, faça upgrade de plano."
      else
        "Você atingiu o limite de cifras permitido."
      end
    end

    # Mensagem de aviso se está perto do limite
    def warning_message
      return nil if !near_limit? || limit.nil?
      "⚠️ Você está usando #{usage_percentage}% do limite de cifras. " \
      "Tem #{available_count} cifra(s) disponível(eis)."
    end

    # ============================================================================
    # Status Completo
    # ============================================================================

    # Retorna status detalhado
    # Formato JSON amigável para API
    def status
      {
        plan: @plan&.name,
        limit: limit,
        limit_label: limit_label,
        used: songs_count,
        available: available_count == Float::INFINITY ? -1 : available_count,
        percentage: usage_percentage,
        can_create: can_create?,
        near_limit: near_limit?,
        at_limit: at_limit?
      }
    end

    # ============================================================================
    # Validação e Exceção
    # ============================================================================

    # Valida se pode criar, joga exceção se não pode
    # Uso: quota.validate!
    def validate!
      unless can_create?
        raise QuotaExceeded, error_message
      end
    end

    # Exceção customizada
    class QuotaExceeded < StandardError; end
  end
end
