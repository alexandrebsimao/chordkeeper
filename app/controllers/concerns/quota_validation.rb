# app/controllers/concerns/quota_validation.rb
# Concern para validar quotas antes de criar/atualizar recursos
#
# Uso em controller:
#   class SongsController < ApiController
#     include Concerns::QuotaValidation
#     before_action :check_quota!, only: [:create]
#   end
#

module Concerns
  module QuotaValidation
    extend ActiveSupport::Concern

    included do
      rescue_from Quota::SongLimitService::QuotaExceeded, with: :render_quota_exceeded
    end

    # Valida se usuário pode criar mais uma cifra
    # Usa before_action em controllers
    def check_quota!
      quota = Quota::SongLimitService.new(current_user)
      
      unless quota.can_create?
        render json: {
          error: quota.error_message,
          quota: quota.status
        }, status: :unprocessable_entity
      end
    end

    # Valida usando .validate! que joga exceção
    def check_quota_strict!
      quota = Quota::SongLimitService.new(current_user)
      quota.validate!  # Joga QuotaExceeded se não pode
    end

    # Obtém serviço de quota do usuário
    def current_quota
      @current_quota ||= Quota::SongLimitService.new(current_user)
    end

    private

    def render_quota_exceeded(exception)
      quota = Quota::SongLimitService.new(current_user)
      render json: {
        error: exception.message,
        quota: quota.status
      }, status: :unprocessable_entity
    end
  end
end
