module Api
  module Admin
    class BaseController < Api::ApiController
      before_action :require_admin_access!

      private

      def require_admin_access!
        return if current_user&.admin?

        render json: { error: "Acesso restrito ao painel administrativo" }, status: :forbidden
      end
    end
  end
end
