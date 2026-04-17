require 'sidekiq'
require 'sidekiq-cron'

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0') }
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://redis:6379/0') }
end

# Carrega o schedule do arquivo sidekiq.yml
sidekiq_config = YAML.load_file(Rails.root.join('config/sidekiq.yml'))
if sidekiq_config && sidekiq_config[:schedule]
  Sidekiq::Cron::Job.load_from_hash(sidekiq_config[:schedule], replace: true)
  Rails.logger.info "✅ Sidekiq Cron Jobs carregados: #{sidekiq_config[:schedule].keys.join(', ')}"
end
