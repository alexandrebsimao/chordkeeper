class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern
  before_action :authenticate_user!, unless: :devise_controller?
  before_action :check_is_current_library, unless: :devise_controller?
  helper_method :current_library

  # Allow CORS for API requests from React frontend
  before_action :configure_permitted_parameters, if: :devise_controller?
  skip_before_action :verify_authenticity_token, if: -> { devise_controller? || json_request? }

  def current_library
    current_user&.current_library
  end

  def check_is_current_library
    return if current_user.nil?
    unless current_library.present?
      library = Library.create(name: "Biblioteca de #{current_user.email}", owner: current_user)
      LibraryUser.create(user: current_user, library: library, is_current_scope: true)
    end
  end

  private

  def json_request?
    request.format.json?
  end

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:email, :password, :password_confirmation])
    devise_parameter_sanitizer.permit(:sign_in, keys: [:email, :password])
  end
end
