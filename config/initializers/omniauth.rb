# config/initializers/devise.rb - Adicionar configuração OmniAuth

Devise.setup do |config|
  # Configurações existentes do Devise...
  
  # OmniAuth Google OAuth2
  config.omniauth :google_oauth2,
    ENV['GOOGLE_CLIENT_ID'],
    ENV['GOOGLE_CLIENT_SECRET'],
    {
      scope: 'email,profile',
      prompt: 'select_account',
      image_aspect_ratio: 'square',
      image_size: 50,
      access_type: 'online',
      name: 'google'
    }
end
