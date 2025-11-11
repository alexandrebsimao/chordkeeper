Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'http://localhost:8080', 'http://127.0.0.1:8080', 'https://chordkeeper.innapses.com', 'https://api-chordkeeper.innapses.com/'
    # resource '/api/*',
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: ['Authorization', 'authorization']
  end
end