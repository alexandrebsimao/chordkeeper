# app/controllers/api/quota_controller.rb
# Endpoints para gerenciar quotas do usuário
#
# GET /api/quota
#   Retorna status de quota de cifras do usuário
#

module Api
  class QuotaController < Api::ApiController
    # GET /api/quota
    def show
      quota = Quota::SongLimitService.new(current_user)
      
      render json: {
        quota: quota.status,
        warning: quota.warning_message,
        message: quota.can_create? ? "Você pode criar mais cifras" : quota.error_message
      }
    end
  end
end
