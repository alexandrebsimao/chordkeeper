# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  skip_before_action :verify_authenticity_token

  def google_oauth2
    @user = User.from_omniauth(request.env['omniauth.auth'])

    if @user.persisted?
      sign_in_and_redirect @user, event: :authentication
      set_flash_message(:notice, :success, kind: 'Google') if is_navigational_format?
    else
      session['devise.google_data'] = request.env['omniauth.auth'].except(:extra)
      redirect_to new_user_session_path, alert: @user.errors.full_messages.join(', ')
    end
  rescue StandardError => e
    Rails.logger.error "Google OAuth error: #{e.message}"
    redirect_to new_user_session_path, alert: 'Falha na autenticação com Google.'
  end

  def failure
    redirect_to new_user_session_path, alert: "Falha na autenticação: #{params[:message]}"
  end
end
