# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  include CookieCsrfProtection

  # Importante: skip CSRF token verification para OmniAuth callbacks
  skip_forgery_protection

  def google_oauth2
    Rails.logger.info "OmniAuth callback received: #{request.env['omniauth.auth']&.provider}"
    
    @user = User.from_omniauth(request.env['omniauth.auth'])

    if @user.persisted?
      # Generate JWT token for the user
      token = Warden::JWTAuth::UserEncoder.new.call(@user, :user, nil).first

      # ✅ SEGURANÇA: Usar HttpOnly cookie em vez de expor token na URL
      cookies.signed[:auth_token] = {
        value: token,
        httponly: true,
        secure: Rails.env.production?,
        same_site: :strict,
        expires: 15.minutes.from_now
      }
      
      # Gerar refresh token também
      refresh_token = generate_refresh_token(@user)
      cookies.signed[:refresh_token] = {
        value: refresh_token,
        httponly: true,
        secure: Rails.env.production?,
        same_site: :strict,
        expires: 14.days.from_now
      }
      set_csrf_token_cookie

      # ✅ Redirecionar SEM token na URL
      redirect_to "#{ENV['FRONTEND_URL']}/auth/callback?success=true&email=#{@user.email}", allow_other_host: true
    else
      session['devise.google_data'] = request.env['omniauth.auth'].except(:extra)
      redirect_to "#{ENV['FRONTEND_URL']}/login?error=#{@user.errors.full_messages.join(',')}", allow_other_host: true
    end
  rescue StandardError => e
    Rails.logger.error "Google OAuth error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    redirect_to "#{ENV['FRONTEND_URL']}/login?error=authentication_failed", allow_other_host: true
  end
  
  private
  
  # Método helper para gerar refresh token
  def generate_refresh_token(user)
    JWT.encode(
      {
        sub: user.id,
        scp: 'user',
        type: 'refresh',
        aud: nil,
        iat: Time.now.to_i,
        exp: 14.days.from_now.to_i,
        jti: SecureRandom.uuid
      },
      ENV.fetch('DEVISE_JWT_SECRET_KEY') { raise 'DEVISE_JWT_SECRET_KEY required!' },
      'HS256'
    )
  end

  def failure
    Rails.logger.error "OmniAuth failure: #{params[:message]}"
    redirect_to "#{ENV['FRONTEND_URL']}/login?error=#{params[:message]}", allow_other_host: true
  end
end
