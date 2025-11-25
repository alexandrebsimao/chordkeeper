# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  # Importante: skip CSRF token verification para OmniAuth callbacks
  skip_before_action :verify_authenticity_token
  skip_forgery_protection

  def google_oauth2
    Rails.logger.info "OmniAuth callback received: #{request.env['omniauth.auth']&.provider}"
    
    @user = User.from_omniauth(request.env['omniauth.auth'])

    if @user.persisted?
      # Generate JWT token for the user
      token = Warden::JWTAuth::UserEncoder.new.call(@user, :user, nil).first

      # Redirect to frontend with token
      redirect_to "#{ENV['FRONTEND_URL']}/auth/callback?token=#{token}&email=#{@user.email}", allow_other_host: true
    else
      session['devise.google_data'] = request.env['omniauth.auth'].except(:extra)
      redirect_to "#{ENV['FRONTEND_URL']}/login?error=#{@user.errors.full_messages.join(',')}", allow_other_host: true
    end
  rescue StandardError => e
    Rails.logger.error "Google OAuth error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    redirect_to "#{ENV['FRONTEND_URL']}/login?error=authentication_failed", allow_other_host: true
  end

  def failure
    Rails.logger.error "OmniAuth failure: #{params[:message]}"
    redirect_to "#{ENV['FRONTEND_URL']}/login?error=#{params[:message]}", allow_other_host: true
  end
end
