# 🔒 SECURITY: Restrictive CORS configuration
# This initializer sets up CORS (Cross-Origin Resource Sharing) with security in mind

module CorsConfig
  # Define allowed origins by environment
  ALLOWED_ORIGINS = {
    'development' => [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080'
    ],
    'staging' => [
      'https://staging.chordkeeper.com',
      'https://staging-app.chordkeeper.com'
    ],
    'production' => [
      'https://chordkeeper.com',
      'https://app.chordkeeper.com',
      'https://www.chordkeeper.com'
    ]
  }.freeze

  # Get allowed origins for current environment
  def self.allowed_origins
    ALLOWED_ORIGINS[Rails.env] || []
  end

  # Validate if origin is allowed
  def self.allowed_origin?(origin)
    allowed_origins.any? { |allowed| origin.to_s =~ /^#{Regexp.escape(allowed)}$/ }
  end
end
