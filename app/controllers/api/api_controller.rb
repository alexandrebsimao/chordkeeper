module Api
  class ApiController < ActionController::API
  #   before_action :authenticate_user_from_token!

    def current_library
      Library.find_by(id: 1)
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