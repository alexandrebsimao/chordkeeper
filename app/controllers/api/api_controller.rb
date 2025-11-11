module Api
  class ApiController < ActionController::API
    before_action :authenticate_user!
    before_action :check_is_current_library, unless: :devise_controller?
    helper_method :current_library

    # Handle parameter parsing errors
    rescue_from ActionDispatch::Http::Parameters::ParseError do |exception|
      render json: { error: 'Invalid request format. Please check your request body and Content-Type header.' }, status: :bad_request
    end

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
    
    private
    
  #   def authenticate_user_from_token!
  #     token = request.headers['Authorization']&.split(' ')&.last
  #     return render json: { error: 'Unauthorized' }, status: :unauthorized unless token
      
  #     begin
  #       decoded = JWT.decode(
  #         token,
  #         Rails.application.credentials.secret_key_base,
  #         true,
  #         { algorithm: 'HS256' }
  #       )
        
  #       @current_user = User.find(decoded[0]['id'])
  #     rescue JWT::ExpiredSignature
  #       render json: { error: 'Token expired' }, status: :unauthorized
  #     rescue JWT::DecodeError
  #       render json: { error: 'Invalid token' }, status: :unauthorized
  #     rescue ActiveRecord::RecordNotFound
  #       render json: { error: 'User not found' }, status: :unauthorized
  #     end
  #   end
    
  #   def current_user
  #     @current_user
  #   end
    
  #   def authenticate_user!
  #     render json: { error: 'Unauthorized' }, status: :unauthorized unless current_user
  #   end
  end
end