# Configuração do OmniAuth para permitir requisições GET do frontend SPA
OmniAuth.config.allowed_request_methods = Rails.env.production? ? [:post] : [:get, :post]
OmniAuth.config.silence_get_warning = !Rails.env.production?
