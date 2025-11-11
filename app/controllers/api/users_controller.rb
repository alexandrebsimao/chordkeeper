module Api
  class UsersController < ApiController
    # GET /api/users/me
    def me
      render json: {
        data: {
          id: current_user.id,
          type: 'user',
          attributes: {
            email: current_user.email,
            created_at: current_user.created_at
          }
        }
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
