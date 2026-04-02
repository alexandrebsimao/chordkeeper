module Authorizarion
  class AuthenticationService < ApplicationService
    def initialize(token:)
      @token = token  
    end

    def call
      begin
        payload = JWT.decode(
          @token,
          ENV.fetch('DEVISE_JWT_SECRET_KEY') { raise 'DEVISE_JWT_SECRET_KEY required!' },
          true,
          { algorithm: 'HS256' }
        ).first

        return { message: 'Token revogado' } if JwtDenylist.exists?(jti: payload['jti'])

        current_user = User.find(payload['sub'])

        if current_user
          { user: current_user }
        else
          { message: 'Usuário não encontrado' }
        end
      rescue JWT::ExpiredSignature
        { message: 'Token expirado' }
      rescue JWT::DecodeError
        { message: 'Token inválido' }
      rescue ActiveRecord::RecordNotFound
        { message: 'Usuário não encontrado' }
      end
    end
  end
end
