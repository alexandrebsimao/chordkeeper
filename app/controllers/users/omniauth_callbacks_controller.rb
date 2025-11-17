# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  skip_before_action :verify_authenticity_token, only: :google_oauth2

  def google_oauth2
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
  end

  def failure
    redirect_to "#{ENV['FRONTEND_URL']}/login?error=#{params[:message]}", allow_other_host: true
  end
end
