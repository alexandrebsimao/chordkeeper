module Api
  class ApiController < ApplicationController
    protect_from_forgery with: :null_session

    before_action :authenticate_user!
    helper_method :current_library, :permission_service

    rescue_from PermissionService::PermissionError do |exception|
      render json: { error: exception.message }, status: :forbidden
    end

    ACTION_PERMISSIONS = {
      index: :read,
      show: :read,
      print: :read,
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
      manage: :admin,
      settings: :admin,
      share: :share,
      public_link_generator: :share,
      public_link_destroyer: :share,
      transfer_ownership: :owner,
      delete_library: :owner
    }.freeze

    def permission_service
      @permission_service ||= PermissionService.new(current_library, current_user)
    end

    def authorize_action!(action = nil)
      action ||= action_name
      permission_type = ACTION_PERMISSIONS[action.to_sym] || :edit
      PermissionService.authorize!(current_library, current_user, permission_type)
    end

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
  end
end
