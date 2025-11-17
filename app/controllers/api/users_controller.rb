module Api
  class UsersController < ApiController
    # GET /api/users/me
    def me
      render json: {
        id: current_user.id,
        email: current_user.email,
        role: current_user.role,
        created_at: current_user.created_at,
        plan_name: current_user.plan_name,
        songs_count: current_user.songs_count,
        setlists_count: current_user.setlists_count,
        songs_limit: current_user.songs_limit,
        setlists_limit: current_user.setlists_limit,
        has_active_subscription: current_user.has_active_subscription?
      }, status: :ok
    end

    # PATCH /api/users/update_password
    def update_password
      if current_user.valid_password?(user_params[:current_password])
        if current_user.update(password: user_params[:password], password_confirmation: user_params[:password_confirmation])
          render json: {
            message: 'Senha atualizada com sucesso'
          }, status: :ok
        else
          render json: {
            message: 'Erro ao atualizar senha',
            errors: current_user.errors.full_messages
          }, status: :unprocessable_entity
        end
      else
        render json: {
          message: 'Senha atual incorreta'
        }, status: :unprocessable_entity
      end
    end

    private

    def user_params
      params.require(:user).permit(:current_password, :password, :password_confirmation)
    end
  end
end
