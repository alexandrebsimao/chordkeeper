class Setlist < ApplicationRecord
  belongs_to :library
  has_many :setlist_songs, dependent: :destroy
  has_many :songs, through: :setlist_songs
  belongs_to :owner, class_name: "User"
  has_one :public_setlist, dependent: :destroy
  
  has_many :setlist_users, dependent: :destroy
  has_many :shared_users, through: :setlist_users, source: :user

  before_create :generate_setlist_users!

  # Verifica se um usuário tem acesso (como dono ou compartilhado)
  def accessible_by?(user)
    return false unless user
    owner_id == user.id || setlist_users.exists?(user_id: user.id)
  end

  # Verifica se um usuário pode editar (como dono ou com permissão de editor)
  def editable_by?(user)
    return false unless user
    owner_id == user.id || setlist_users.exists?(user_id: user.id, role: :editor)
  end

  # Retorna a permissão do usuário
  def permission_for(user)
    return :owner if owner_id == user.id
    setlist_user = setlist_users.find_by(user_id: user.id)
    setlist_user&.role&.to_sym
  end

  def generate_public_setlist!
    if self.public_setlist.nil?
      self.public_setlist = PublicSetlist.new(setlist: self)
      self.public_setlist.save
    end
  end

  def songs_not_in_setlist
    library.songs.where.not(id: songs.select(:id))
  end

  def generate_setlist_users!
    # Garante que o dono sempre tenha acesso
    if setlist_users.where(user_id: owner_id).empty?
      setlist_users.create(user_id: owner_id, role: :owner)
    end
  end
end
