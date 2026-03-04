# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  protect_from_forgery with: :null_session
  skip_before_action :verify_authenticity_token
  respond_to :json

  def create
    Rails.logger.info "Login attempt for: #{params[:user]&.[](:email)}"
    
    self.resource = warden.authenticate!(auth_options)
    set_flash_message!(:notice, :signed_in)
    sign_in(resource_name, resource)
    yield resource if block_given?
    
    # Gerar access token e refresh token
    access_token = generate_access_token(resource)
    refresh_token = generate_refresh_token(resource)
    
    response.set_header('Authorization', "Bearer #{access_token}")
    
    render json: {
      message: 'Logged in successfully.',
      access_token: "Bearer #{access_token}",
      refresh_token: refresh_token,
      expires_in: 15.minutes.to_i,
      user: {
        id: resource.id,
        email: resource.email
      }
    }, status: :ok
  end

  # Endpoint para renovar o access token usando refresh token
  def refresh
    refresh_token = params[:refresh_token]
    
    begin
      decoded = JWT.decode(
        refresh_token,
        ENV.fetch('DEVISE_JWT_SECRET_KEY', 'f28f75ec47b06ab533cf379bc8717efea2fa792dfa5d51e27179f8cda32c62b6c03d1e53c6e25b67e8649a452375fe0baaa472c2cc2bb09f8fa735e30f1e657d'),
        true,
        { verify_expiration: true, algorithm: 'HS256' }
      ).first
      
      # Verificar se é um refresh token
      if decoded['type'] != 'refresh'
        render json: { error: 'Token inválido' }, status: :unauthorized
        return
      end
      
      # Verificar se o token está na denylist
      if JwtDenylist.exists?(jti: decoded['jti'])
        render json: { error: 'Token revogado' }, status: :unauthorized
        return
      end
      
      user = User.find(decoded['sub'])
      new_access_token = generate_access_token(user)
      
      render json: {
        access_token: "Bearer #{new_access_token}",
        expires_in: 15.minutes.to_i
      }, status: :ok
      
    rescue JWT::ExpiredSignature
      render json: { error: 'Refresh token expirado. Faça login novamente.' }, status: :unauthorized
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      render json: { error: 'Token inválido' }, status: :unauthorized
    end
  end

  private

  def generate_access_token(user)
    JWT.encode(
      {
        sub: user.id,
        scp: 'user',
        type: 'access',
        aud: nil,
        iat: Time.now.to_i,
        exp: 15.minutes.from_now.to_i,
        jti: SecureRandom.uuid
      },
      ENV.fetch('DEVISE_JWT_SECRET_KEY', 'f28f75ec47b06ab533cf379bc8717efea2fa792dfa5d51e27179f8cda32c62b6c03d1e53c6e25b67e8649a452375fe0baaa472c2cc2bb09f8fa735e30f1e657d'),
      'HS256'
    )
  end

  def generate_refresh_token(user)
    JWT.encode(
      {
        sub: user.id,
        scp: 'user',
        type: 'refresh',
        aud: nil,
        iat: Time.now.to_i,
        exp: 30.days.from_now.to_i,
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
