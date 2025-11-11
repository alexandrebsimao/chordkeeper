# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  protect_from_forgery with: :null_session
  respond_to :json

  def create
    self.resource = warden.authenticate!(auth_options)
    set_flash_message!(:notice, :signed_in)
    sign_in(resource_name, resource)
    yield resource if block_given?
    
    # Gerar token JWT manualmente
    token = generate_jwt(resource)
    response.set_header('Authorization', "Bearer #{token}")
    
    render json: {
      message: 'Logged in successfully.',
      token: "Bearer #{token}",
      user: {
        id: resource.id,
        email: resource.email
      }
    }, status: :ok
  end

  private

  def generate_jwt(user)
    JWT.encode(
      {
        sub: user.id,
        scp: 'user',
        aud: nil,
        iat: Time.now.to_i,
        exp: (Time.now + 30.days).to_i,
        jti: SecureRandom.uuid
      },
      ENV.fetch('DEVISE_JWT_SECRET_KEY', 'f28f75ec47b06ab533cf379bc8717efea2fa792dfa5d51e27179f8cda32c62b6c03d1e53c6e25b67e8649a452375fe0baaa472c2cc2bb09f8fa735e30f1e657d'),
      'HS256'
    )
  end

  def respond_with(resource, _opts = {})
    render json: {
      message: 'Logged in successfully.',
      user: {
        id: resource.id,
        email: resource.email
      }
    }, status: :ok
  end

  def respond_to_on_destroy
    if request.headers['Authorization'].present?
      jwt_payload = JWT.decode(request.headers['Authorization'].split(' ').last, 
                                ENV.fetch('DEVISE_JWT_SECRET_KEY', 'f28f75ec47b06ab533cf379bc8717efea2fa792dfa5d51e27179f8cda32c62b6c03d1e53c6e25b67e8649a452375fe0baaa472c2cc2bb09f8fa735e30f1e657d')).first
      current_user = User.find(jwt_payload['sub'])
    end
    
    if current_user
      render json: {
        message: 'Logged out successfully.'
      }, status: :ok
    else
      render json: {
        message: 'No active session.'
      }, status: :unauthorized
    end
  rescue JWT::DecodeError
    render json: {
      message: 'Invalid token.'
    }, status: :unauthorized
  end
end
