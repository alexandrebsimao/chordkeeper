# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  include CookieCsrfProtection

  protect_from_forgery with: :null_session
  skip_before_action :verify_authenticity_token
  skip_before_action :require_no_authentication, only: :create
  before_action :verify_csrf_token_for_cookie_auth!, only: :refresh
  respond_to :json

  def create
    Rails.logger.info "Login attempt for: #{params[:user]&.[](:email)}"

    self.resource = authenticate_with_password!
    return if performed?

    set_flash_message!(:notice, :signed_in)
    sign_in(resource_name, resource, store: false)
    yield resource if block_given?
    
    # Gerar access token e refresh token
    access_token = generate_access_token(resource)
    refresh_token = generate_refresh_token(resource)
    
    # ✅ SEGURANÇA: Usar HttpOnly cookies em vez de retornar no body
    # Protege contra XSS - JavaScript não consegue acessar os cookies
    cookies.signed[:auth_token] = {
      value: access_token,
      **auth_cookie_options(expires: 15.minutes.from_now)
    }
    
    cookies.signed[:refresh_token] = {
      value: refresh_token,
      **auth_cookie_options(expires: 14.days.from_now) # Reduzido de 30 para 14 dias
    }
    set_csrf_token_cookie
    
    # Ainda enviar no header para compatibilidade com apps móveis
    response.set_header('Authorization', "Bearer #{access_token}")
    
    render json: {
      message: 'Logged in successfully.',
      user: {
        id: resource.id,
        email: resource.email
      },
      # ⚠️ Não enviar tokens no body em produção
      # Tokens estão nos cookies HttpOnly
      uses_cookies: true
    }, status: :ok
  end

  # Endpoint para renovar o access token usando refresh token
  def refresh
    # ✅ SEGURANÇA: Ler refresh token do cookie HttpOnly
    refresh_token = cookies.signed[:refresh_token] || params[:refresh_token]
    
    if refresh_token.blank?
      render json: { error: 'Refresh token não fornecido' }, status: :unauthorized
      return
    end
    
    begin
      decoded = JWT.decode(
        refresh_token,
        ENV.fetch('DEVISE_JWT_SECRET_KEY') { raise 'DEVISE_JWT_SECRET_KEY required!' },
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
      
      # ✅ SEGURANÇA: Atualizar cookie com novo access token
      cookies.signed[:auth_token] = {
        value: new_access_token,
        **auth_cookie_options(expires: 15.minutes.from_now)
      }
      set_csrf_token_cookie if cookies[:csrf_token].blank?
      
      # Header para compatibilidade mobile
      response.set_header('Authorization', "Bearer #{new_access_token}")
      
      render json: {
        message: 'Token renovado com sucesso',
        uses_cookies: true
      }, status: :ok
      
    rescue JWT::ExpiredSignature
      # ✅ Limpar cookies expirados
      delete_auth_cookies
      render json: { error: 'Refresh token expirado. Faça login novamente.' }, status: :unauthorized
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound => e
      Rails.logger.error "Refresh token error: #{e.message}"
      render json: { error: 'Token inválido' }, status: :unauthorized
    end
  end

  private

  def authenticate_with_password!
    raw_user_params = params[:user]
    user_params = raw_user_params.respond_to?(:permit) ? raw_user_params.permit(:email, :password) : {}
    email = user_params[:email].to_s.strip.downcase
    password = user_params[:password].to_s
    user = resource_class.find_for_database_authentication(email: email)

    unless user&.valid_password?(password)
      delete_auth_cookies
      render json: { error: "Email ou senha inválidos" }, status: :unauthorized
      return
    end

    unless user.active_for_authentication?
      delete_auth_cookies
      render json: {
        error: inactive_message_for(user),
        unconfirmed: user.inactive_message == :unconfirmed
      }, status: :unauthorized
      return
    end

    user
  end

  def inactive_message_for(user)
    if user.inactive_message == :unconfirmed
      "Você precisa confirmar seu email antes de fazer login."
    else
      "Sua conta não está ativa."
    end
  end

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
      ENV.fetch('DEVISE_JWT_SECRET_KEY') { raise 'DEVISE_JWT_SECRET_KEY required!' },
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
        exp: 14.days.from_now.to_i, # Reduzido de 30 para 14 dias
        jti: SecureRandom.uuid
      },
      ENV.fetch('DEVISE_JWT_SECRET_KEY') { raise 'DEVISE_JWT_SECRET_KEY required!' },
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
    access_token = cookies.signed[:auth_token] || bearer_token
    refresh_token = cookies.signed[:refresh_token]

    revoke_token(access_token)
    revoke_token(refresh_token)

    # ✅ SEGURANÇA: Limpar cookies ao fazer logout
    delete_auth_cookies

    render json: {
      message: 'Logged out successfully.'
    }, status: :ok
  end

  def bearer_token
    auth_header = request.headers['Authorization'].to_s
    return unless auth_header.start_with?('Bearer ')

    auth_header.split(' ').last
  end

  def revoke_token(token)
    return if token.blank?

    payload = JWT.decode(
      token,
      ENV.fetch('DEVISE_JWT_SECRET_KEY') { raise 'DEVISE_JWT_SECRET_KEY required!' },
      true,
      { verify_expiration: false, algorithm: 'HS256' }
    ).first

    return if payload['jti'].blank? || payload['exp'].blank?

    JwtDenylist.find_or_create_by!(jti: payload['jti']) do |denylisted_token|
      denylisted_token.exp = Time.zone.at(payload['exp'])
    end
  rescue JWT::DecodeError => e
    Rails.logger.info "Logout token revoke skipped: #{e.message}"
  end
end
