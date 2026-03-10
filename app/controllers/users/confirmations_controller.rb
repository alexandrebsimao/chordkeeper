# frozen_string_literal: true

class Users::ConfirmationsController < Devise::ConfirmationsController
  protect_from_forgery with: :null_session
  respond_to :json

  # POST /resource/confirmation - Resend confirmation instructions
  def create
    self.resource = resource_class.send_confirmation_instructions(resource_params)
    yield resource if block_given?

    if successfully_sent?(resource)
      respond_with(resource, location: after_resending_confirmation_instructions_path_for(resource_name))
    else
      respond_with(resource)
    end
  end

  # GET /resource/confirmation?confirmation_token=abcdef - Confirm account
  def show
    confirmation_token = params[:confirmation_token]
    frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:8080')
    
    # Confirm the user account
    self.resource = resource_class.confirm_by_token(confirmation_token)
    
    if resource.errors.empty?
      # Confirmation successful - redirect to frontend with success parameter
      redirect_to "#{frontend_url}/auth/confirm-email?status=success", allow_other_host: true
    else
      # Confirmation failed - redirect to frontend with error parameter
      error_message = resource.errors.full_messages.join(', ')
      redirect_to "#{frontend_url}/auth/confirm-email?status=error&message=#{ERB::Util.url_encode(error_message)}", allow_other_host: true
    end
  end

  private

  def respond_with(resource, _opts = {})
    if resource.errors.empty?
      render json: {
        status: { code: 200, message: 'Confirmation instructions sent successfully.' }
      }, status: :ok
    else
      render json: {
        status: { message: "Confirmation instructions couldn't be sent." },
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end
end
