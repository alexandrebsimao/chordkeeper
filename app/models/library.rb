class Library < ApplicationRecord
  has_many :songs, dependent: :destroy
  has_many :library_users, dependent: :destroy
  has_many :shared_users, through: :library_users, source: :user
  has_many :setlists, dependent: :destroy
  belongs_to :owner, class_name: "User"

  validates :name, presence: true

  # Verifica se um usuário tem acesso (como dono ou compartilhado)
  def accessible_by?(user)
    return false unless user
    owner_id == user.id || library_users.exists?(user_id: user.id)
  end

  # Verifica se um usuário pode editar (como dono ou com permissão de editor)
  def editable_by?(user)
    return false unless user
    owner_id == user.id || library_users.exists?(user_id: user.id, permission: :editor)
  end

  # Verifica se um usuário pode compartilhar setlists (apenas admin e editor)
  def can_share_setlists?(user)
    return false unless user
    owner_id == user.id || library_users.exists?(user_id: user.id, permission: [:admin, :editor])
  end

  # Retorna a permissão do usuário
  def permission_for(user)
    return :owner if owner_id == user.id
    library_user = library_users.find_by(user_id: user.id)
    library_user&.permission&.to_sym
  end
end
