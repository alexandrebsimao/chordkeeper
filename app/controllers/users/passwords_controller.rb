# frozen_string_literal: true

class Users::PasswordsController < Devise::PasswordsController
  protect_from_forgery with: :null_session
  respond_to :json
  layout 'devise'

  def create
    self.resource = resource_class.send_reset_password_instructions(resource_params)
    yield resource if block_given?

    if successfully_sent?(resource)
      respond_with({}, location: after_sending_reset_password_instructions_path_for(resource_name))
    else
      respond_with(resource)
    end
  end

  private

  def respond_with(resource, _opts = {})
    if resource.errors.empty?
      render json: {
        status: { code: 200, message: 'Password reset instructions sent successfully.' }
      }, status: :ok
    else
      render json: {
        status: { message: "Password reset instructions couldn't be sent." },
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end
end
