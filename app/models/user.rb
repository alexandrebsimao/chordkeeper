class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :omniauthable,
         omniauth_providers: [:google_oauth2]

  has_many :library_users, dependent: :destroy
  has_many :libraries, through: :library_users

  has_many :shared_libraries, through: :library_users, source: :library
  has_many :owned_libraries, class_name: "Library", foreign_key: "owner_id", dependent: :destroy

  has_many :setlist_users, dependent: :destroy
  has_many :shared_setlists, through: :setlist_users, source: :setlist
  has_many :owned_setlists, class_name: "Setlist", foreign_key: "owner_id", dependent: :destroy

  after_create :create_library!

  def accessible_libraries
    Library.left_joins(:library_users)
           .where("library_users.user_id = ?", id)
           .order("library_users.created_at ASC")
  end

  def current_library
    owned_libraries.first
  end

  def set_current_library(library)
    return false unless accessible_libraries.exists?(library.id)

    library_users.update_all(is_current_scope: false)

    library_user = library_users.find_by(library: library)
    library_user.is_current_scope = true
    library_user.save

    true
  end

  def self.from_omniauth(auth)
    user = where(provider: auth.provider, uid: auth.uid).first

    if user.nil?
      user = find_by(email: auth.info.email)

      if user
        user.update(
          provider: auth.provider,
          uid: auth.uid,
          name: auth.info.name || user.name,
          avatar_url: auth.info.image
        )
      else
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

  private

  def create_library!
    library = Library.create(name: "Biblioteca de #{name || email}", owner: self)
    LibraryUser.create(user: self, library: library, is_current_scope: true)
    library
  end
end
