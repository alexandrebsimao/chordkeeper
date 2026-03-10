Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Load allowed origins from environment variable (comma-separated)
    # Example: ALLOWED_ORIGINS="http://localhost:8080,https://app.example.com"
    allowed_origins = ENV.fetch('ALLOWED_CORS_ORIGINS', 'http://localhost:8080,http://127.0.0.1:8080').split(',').map(&:strip)
    origins(*allowed_origins)
    
    # Restrict CORS to API routes only for better security
    resource '/api/*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: ['Authorization', 'authorization']
    
    # Allow public setlist routes
    resource '/users/*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: ['Authorization', 'authorization']
  end
end