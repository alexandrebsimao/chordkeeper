class PublicSetlist < ApplicationRecord
  belongs_to :setlist
  before_create :generate_public_token

  def generate_public_token
    begin
      self.uuid = SecureRandom.hex(10)
    end
  end
end
