# Custom failure app for Devise to handle JSON responses
class CustomDeviseFailure < Devise::FailureApp
  def respond
    if request.format == :json
      json_failure
    else
      super
    end
  end

  def json_failure
    self.status = 401
    self.content_type = 'application/json'
    
    # Check if the failure is due to unconfirmed email
    email = request.params.dig('user', 'email')
    error_message = 'Invalid email or password'
    
    if email.present?
      user = User.find_by(email: email)
      if user && !user.confirmed?
        error_message = 'You need to confirm your email before logging in. Please check your inbox.'
        self.response_body = { 
          error: error_message,
          unconfirmed: true 
        }.to_json
        return
      end
    end
    
    self.response_body = { error: error_message }.to_json
  end

  # Override to prevent redirect for unauthenticated JSON requests
  def http_auth?
    request.format == :json || super
  end
end

# Configure Devise to use custom failure app
Devise.setup do |config|
  config.warden do |manager|
    manager.failure_app = CustomDeviseFailure
  end
end
