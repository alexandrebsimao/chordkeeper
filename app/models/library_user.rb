class LibraryUser < ApplicationRecord
  belongs_to :user
  belongs_to :library

  # enum :role, { read_only: "read_only", editor: "editor", admin: "admin" }, validate: true

  validates :user_id, uniqueness: { scope: :library_id, message: "já tem acesso a esta biblioteca" }
  validate :cannot_share_with_owner

  # Alias para manter compatibilidade com o código que usa permission
  alias_attribute :permission, :role

  private

  def cannot_share_with_owner
    return if persisted?
    if library && user_id == library.owner_id
      errors.add(:user_id, "não pode compartilhar com o proprietário")
    end
  end
end
