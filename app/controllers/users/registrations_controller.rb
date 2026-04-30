# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
  include CookieCsrfProtection

  protect_from_forgery with: :null_session
  respond_to :json

  def create
    build_resource(sign_up_params)

    resource.save
    yield resource if block_given?
    if resource.persisted?
      if resource.active_for_authentication?
        set_flash_message! :notice, :signed_up
        sign_up(resource_name, resource)
        
        # Gerar access token e refresh token
        access_token = generate_access_token(resource)
        refresh_token = generate_refresh_token(resource)

        cookies.signed[:auth_token] = {
          value: access_token,
          **auth_cookie_options(expires: 15.minutes.from_now)
        }

        cookies.signed[:refresh_token] = {
          value: refresh_token,
          **auth_cookie_options(expires: 14.days.from_now)
        }
        set_csrf_token_cookie
        
        response.set_header('Authorization', "Bearer #{access_token}")
        
        render json: {
          message: 'Signed up successfully.',
          uses_cookies: true,
          user: {
            id: resource.id,
            email: resource.email
          }
        }, status: :ok
      else
        set_flash_message! :notice, :"signed_up_but_#{resource.inactive_message}"
        expire_data_after_sign_in!
        render json: {
          message: "Signed up but #{resource.inactive_message}.",
          user: {
            id: resource.id,
            email: resource.email
          }
        }, status: :ok
      end
    else
      clean_up_passwords resource
      set_minimum_password_length
      render json: {
        message: "User couldn't be created successfully.",
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
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
        exp: 14.days.from_now.to_i,
        jti: SecureRandom.uuid
      },
      ENV.fetch('DEVISE_JWT_SECRET_KEY') { raise 'DEVISE_JWT_SECRET_KEY required!' },
      'HS256'
    )
  end

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        message: 'Signed up successfully.',
        user: {
          id: resource.id,
          email: resource.email
        }
      }, status: :ok
    else
      render json: {
        message: "User couldn't be created successfully.",
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end
end
