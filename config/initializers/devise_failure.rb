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
    self.response_body = { error: 'Invalid email or password' }.to_json
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
