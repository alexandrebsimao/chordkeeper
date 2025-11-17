module Api::Admin
  class BaseController < ApplicationController
    skip_before_action :verify_authenticity_token
    before_action :authenticate_user!
    before_action :ensure_admin!

    private

    def ensure_admin!
      unless current_user&.admin?
        render json: { error: 'Acesso negado. Apenas administradores.' }, status: :forbidden
      end
    end
  end
end
