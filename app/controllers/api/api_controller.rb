module Api
  class ApiController < ActionController::API
    before_action :authenticate_user!
    before_action :check_is_current_library, unless: :devise_controller?
    helper_method :current_library, :permission_service

    # Handle parameter parsing errors
    rescue_from ActionDispatch::Http::Parameters::ParseError do |exception|
      render json: { error: 'Invalid request format. Please check your request body and Content-Type header.' }, status: :bad_request
    end

    # Handle permission errors
    rescue_from PermissionService::PermissionError do |exception|
      render json: { error: exception.message }, status: :forbidden
    end

    def current_library
      current_user&.current_library
    end

    def permission_service
      @permission_service ||= PermissionService.new(current_library, current_user)
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

    def check_is_current_library
      return if current_user.nil?
      unless current_library.present?
        ActiveRecord::Base.transaction do
          library = Library.create(name: "Biblioteca de #{current_user.email}", owner: current_user)
          LibraryUser.create!(user: current_user, library: library, is_current_scope: true)
        end
      end
    end

  end
end