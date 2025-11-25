class LibraryUser < ApplicationRecord
  belongs_to :user
  belongs_to :library

  # enum :role, { read_only: "read_only", editor: "editor", admin: "admin" }, validate: true

  validates :user_id, uniqueness: { scope: :library_id, message: "já tem acesso a esta biblioteca" }

  # Alias para manter compatibilidade com o código que usa permission
  alias_attribute :permission, :role
end
