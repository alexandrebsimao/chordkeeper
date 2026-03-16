module Api
  class UsersController < ApiController
    # GET /api/users/me
    def me
      Rails.logger.info "UsersController#me called by user: #{current_user&.email}"
      
      if current_user.nil?
        render json: { error: 'Not authenticated' }, status: :unauthorized
        return
      end
      
      current_lib = current_user.current_library
      library_data = nil
      
      if current_lib
        library_data = {
          id: current_lib.id,
          name: current_lib.name,
          description: current_lib.description,
          owner_id: current_lib.owner_id,
          permission: current_lib.permission_for(current_user)
        }
      end
      
      render json: {
        data: {
          id: current_user.id,
          type: 'user',
          attributes: {
            id: current_user.id,
            email: current_user.email,
            name: current_user.name || "#{current_user.email.split('@').first}",
            library: library_data,
            confirmed: current_user.confirmed?,
            created_at: current_user.created_at
          }
        }
      }, status: :ok
    rescue => e
      Rails.logger.error "UsersController#me error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: e.message }, status: :internal_server_error
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
