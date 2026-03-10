# ✅ SEGURANÇA: Configuração customizada para ler JWT de cookies HttpOnly
# Custom Warden strategy para suportar autenticação via cookies

# Custom strategy to read JWT from cookies
Warden::Strategies.add(:jwt_cookie) do
  def valid?
    # Válido se houver token no header OU no cookie
    auth_header.present? || auth_cookie.present?
  end

  def authenticate!
    token = extract_token
    
    return fail!('Token não fornecido') if token.blank?
    
    begin
      # Decode the token
      payload = JWT.decode(
        token,
        ENV.fetch('DEVISE_JWT_SECRET_KEY') { raise 'DEVISE_JWT_SECRET_KEY required!' },
        true,
        { verify_expiration: true, algorithm: 'HS256' }
      ).first
      
      # Verificar se o token está na denylist
      if JwtDenylist.exists?(jti: payload['jti'])
        return fail!('Token revogado')
      end
      
      # Find the user
      user = User.find(payload['sub'])
      
      if user
        success!(user)
      else
        fail!('Usuário não encontrado')
      end
      
    rescue JWT::ExpiredSignature
      fail!('Token expirado')
    rescue JWT::DecodeError => e
      Rails.logger.error "JWT decode error: #{e.message}"
      fail!('Token inválido')
    rescue ActiveRecord::RecordNotFound
      fail!('Usuário não encontrado')
    end
  end
  
  private
  
  def auth_header
    env['HTTP_AUTHORIZATION']
  end
  
  def auth_cookie
    # Ler do cookie signed
    request.cookie_jar.signed[:auth_token]
  end
  
  def extract_token
    # Priorizar cookie HttpOnly sobre header (mais seguro)
    if auth_cookie.present?
      auth_cookie
    elsif auth_header.present? && auth_header.start_with?('Bearer ')
      auth_header.split(' ').last
    else
      nil
    end
  end
  
  def request
    @request ||= ActionDispatch::Request.new(env)
  end
end

# Add the cookie strategy to Devise
Rails.application.config.to_prepare do
  Devise.setup do |config|
    # Add jwt_cookie strategy before jwt_authenticatable
    config.warden do |manager|
      manager.default_strategies(scope: :user).unshift :jwt_cookie
    end
  end
end
