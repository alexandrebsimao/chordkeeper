module ApiHelpers
  # For API controllers with JWT, we need to stub Devise methods directly
  # since Warden/session-based authentication doesn't work with ActionController::API
end

RSpec.configure do |config|
  config.include ApiHelpers, type: :request
  
  # For API request specs, stub authentication at the controller level
  config.before(:each, type: :request) do |example|
    if example.metadata[:api_request]
      # This will be set per-test
    end
  end
end
