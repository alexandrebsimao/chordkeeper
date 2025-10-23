class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern
  before_action :authenticate_user!
  before_action :check_is_current_library
  helper_method :current_library

  def current_library
    @current_library ||= Library.find_by(id: session[:current_library_id])
    @current_library ||= Library
                            .joins(:library_users)
                            .where(library_users: { user_id: current_user.id })
                            .first
    session[:current_library_id] = @current_library&.id if session[:current_library_id] != @current_library&.id
    @current_library
  end

  def check_is_current_library
    return if current_user.nil?
    unless current_library.present?
      library = Library.create(name: "Biblioteca de #{current_user.email}", owner: current_user)
      LibraryUser.create(user: current_user, library: library)
    end
  end
end
