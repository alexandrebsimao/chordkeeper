# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
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
        
        # Gerar token JWT
        token = generate_jwt(resource)
        response.set_header('Authorization', "Bearer #{token}")
        
        render json: {
          message: 'Signed up successfully.',
          token: "Bearer #{token}",
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

  def generate_jwt(user)
    JWT.encode(
      {
        sub: user.id,
        scp: 'user',
        aud: nil,
        iat: Time.now.to_i,
        exp: 1.hour.from_now.to_i,
        jti: SecureRandom.uuid
      },
      ENV.fetch('DEVISE_JWT_SECRET_KEY', 'f28f75ec47b06ab533cf379bc8717efea2fa792dfa5d51e27179f8cda32c62b6c03d1e53c6e25b67e8649a452375fe0baaa472c2cc2bb09f8fa735e30f1e657d'),
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
