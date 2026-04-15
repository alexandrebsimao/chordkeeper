module Api
  class ApiController < ActionController::API
    include CookieCsrfProtection
    # include Devise::Controllers::Helpers
    
    before_action :authenticate_user_from_jwt!
    before_action :verify_csrf_token_for_cookie_auth!, if: :state_changing_request?
    helper_method :current_library, :permission_service, :current_user

    # Handle parameter parsing errors
    rescue_from ActionDispatch::Http::Parameters::ParseError do |exception|
      render json: { error: 'Invalid request format. Please check your request body and Content-Type header.' }, status: :bad_request
    end

    # Handle permission errors
    rescue_from PermissionService::PermissionError do |exception|
      render json: { error: exception.message }, status: :forbidden
    end

    # Mapeamento de actions para permissões
    ACTION_PERMISSIONS = {
      # Actions de leitura
      index: :read,
      show: :read,
      print: :read,
      
      # Actions de escrita/edição
      new: :edit,
      create: :edit,
      edit: :edit,
      update: :edit,
      destroy: :edit,
      manage_songs: :edit,
      save_songs: :edit,
      add_song: :edit,
      remove_song: :edit,
      reorder_songs: :edit,
      transpose: :edit,
      
      # Actions administrativas
      manage: :admin,
      settings: :admin,
      
      # Actions de compartilhamento
      share: :share,
      public_link_generator: :share,
      public_link_destroyer: :share,
      
      # Actions do proprietário
      transfer_ownership: :owner,
      delete_library: :owner
    }.freeze

    def current_user
      @current_user
    end

    def current_library
      current_user&.current_library
    end

    def permission_service
      @permission_service ||= PermissionService.new(current_library, current_user)
    end

    # Método genérico que valida permissão baseado na action
    def authorize_action!(action = nil)
      action ||= action_name
      permission_type = ACTION_PERMISSIONS[action.to_sym] || :edit
      PermissionService.authorize!(current_library, current_user, permission_type)
    end

    # Métodos auxiliares específicos (mantidos para casos especiais)
    def require_edit_permission!
      PermissionService.authorize!(current_library, current_user, :edit)
    end

    def require_admin_permission!
      PermissionService.authorize!(current_library, current_user, :admin)
    end

    def require_owner_permission!
      PermissionService.authorize!(current_library, current_user, :owner)
    end

    def require_share_permission!
      PermissionService.authorize!(current_library, current_user, :share)
    end

    private

    def authenticate_user_from_jwt!
      token = extract_token_from_request
      return render_unauthorized('Token não fornecido') if token.blank?

      authentication_service = Authorizarion::AuthenticationService.new(token: token)
      result = authentication_service.call

      if result[:user]
        @current_user = result[:user]
      else
        render_unauthorized(result[:message])
      end
    end

    def extract_token_from_request
      if request.cookie_jar.signed[:auth_token].present?
        request.cookie_jar.signed[:auth_token]
      elsif request.headers['Authorization'].present? && request.headers['Authorization'].start_with?('Bearer ')
        request.headers['Authorization'].split(' ').last
      else
        nil
      end
    end

    def render_unauthorized(message = 'Não autorizado')
      render json: { error: message }, status: :unauthorized
    end
  end
end
