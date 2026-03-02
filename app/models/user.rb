class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, :omniauthable,
         jwt_revocation_strategy: JwtDenylist,
         omniauth_providers: [:google_oauth2]

  has_many :library_users, dependent: :destroy
  has_many :libraries, through: :library_users

  has_many :shared_libraries, through: :library_users, source: :library
  has_many :owned_libraries, class_name: "Library", foreign_key: "owner_id", dependent: :destroy

  has_many :setlist_users, dependent: :destroy
  has_many :shared_setlists, through: :setlist_users, source: :setlist
  has_many :owned_setlists, class_name: "Setlist", foreign_key: "owner_id", dependent: :destroy
  
  # Retorna todas as bibliotecas que o usuário pode acessar (próprias + compartilhadas)
  def accessible_libraries
    Library.left_joins(:library_users)
           .where("library_users.user_id = ?", id)
           .order("library_users.created_at ASC")
  end

  # Retorna a biblioteca com escopo atual
  def current_library
    # Busca pela library_users com is_current_scope = true
    library_users.find_by(is_current_scope: true)&.library || owned_libraries.first || shared_libraries.first
  end

  # Define o escopo atual
  def set_current_library(library)
    return false unless accessible_libraries.exists?(library.id)
    
    # Remove o escopo atual de todas as library_users
    library_users.update_all(is_current_scope: false)
    
    library_user = library_users.find_by(library: library)
    library_user.is_current_scope = true
    library_user.save
    
    true
  end

  # OAuth: Find or create user from Google OAuth data
  def self.from_omniauth(auth)
    # Primeiro tenta encontrar por provider e uid
    user = where(provider: auth.provider, uid: auth.uid).first
    
    # Se não encontrar, busca por email
    if user.nil?
      user = find_by(email: auth.info.email)
      
      # Se encontrou por email, atualiza com dados do OAuth
      if user
        user.update(
          provider: auth.provider,
          uid: auth.uid,
          name: auth.info.name || user.name,
          avatar_url: auth.info.image
        )
      else
        # Se não existe, cria novo usuário
        user = create(
          provider: auth.provider,
          uid: auth.uid,
          email: auth.info.email,
          password: Devise.friendly_token[0, 20],
          name: auth.info.name,
          avatar_url: auth.info.image
        )
      end
    end
    
    user
  end
end
