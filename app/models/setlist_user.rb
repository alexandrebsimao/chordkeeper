class SetlistUser < ApplicationRecord
  belongs_to :user
  belongs_to :setlist

  validates :user_id, uniqueness: { scope: :setlist_id, message: "já tem acesso a este setlist" }

  # Alias para manter compatibilidade com o código que usa permission
  alias_attribute :permission, :role
end
