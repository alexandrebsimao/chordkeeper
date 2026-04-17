require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Myapp
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.0

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Use Sidekiq for Active Job
    config.active_job.queue_adapter = :sidekiq

    # 🔒 SECURITY: Add Rack::Attack for rate limiting (must be before CORS)
    config.middleware.insert_before 0, Rack::Attack

    # 🔒 SECURITY: Restrictive CORS configuration
    # Only allow specific domains based on environment
    config.middleware.insert_before 0, Rack::Cors do
      allowed_origins = CorsConfig.allowed_origins
      
      allow do
        origins allowed_origins
        resource '/api/*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head],
          credentials: true,
          max_age: 3600 # Cache preflight requests for 1 hour
      end

      # Allow public resources without credentials
      allow do
        origins allowed_origins
        resource '/public/*',
          headers: :any,
          methods: [:get, :head, :options]
      end
    end
  end
end
