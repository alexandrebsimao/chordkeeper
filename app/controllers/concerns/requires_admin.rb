module RequiresAdmin
  extend ActiveSupport::Concern

  included do
    before_action :verify_admin!, only: [:update_subscription, :index, :show]
  end

  private

  def verify_admin!
    return if current_user&.admin?

    render json: { 
      error: "Acesso negado. Apenas administradores podem acessar esse recurso." 
    }, status: :forbidden
  end
end
