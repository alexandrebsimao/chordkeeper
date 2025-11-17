module PlanLimitable
  extend ActiveSupport::Concern

  included do
    before_action :check_plan_limits, only: [:create]
  end

  private

  def check_plan_limits
    return if current_user.admin?
    
    case controller_name
    when 'songs'
      check_songs_limit
    when 'setlists'
      check_setlists_limit
    end
  end

  def check_songs_limit
    unless current_user.can_create_song?
      render json: { 
        error: 'Limite de músicas atingido', 
        message: "Seu plano permite até #{current_user.songs_limit} músicas. Faça upgrade para adicionar mais.",
        current_count: current_user.songs_count,
        limit: current_user.songs_limit
      }, status: :forbidden
    end
  end

  def check_setlists_limit
    unless current_user.can_create_setlist?
      render json: { 
        error: 'Limite de setlists atingido',
        message: "Seu plano permite até #{current_user.setlists_limit} setlists. Faça upgrade para adicionar mais.",
        current_count: current_user.setlists_count,
        limit: current_user.setlists_limit
      }, status: :forbidden
    end
  end

  def check_feature_access(feature_key)
    unless current_user.has_feature?(feature_key)
      render json: { 
        error: 'Funcionalidade não disponível',
        message: 'Esta funcionalidade não está disponível no seu plano atual. Faça upgrade para acessar.'
      }, status: :forbidden
    end
  end
end
