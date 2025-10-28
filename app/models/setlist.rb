class Setlist < ApplicationRecord
  belongs_to :library
  has_many :setlist_songs, dependent: :destroy
  has_many :songs, through: :setlist_songs
  belongs_to :owner, class_name: "User"
  has_one :public_setlist, dependent: :destroy

  def generate_public_setlist!
    if self.public_setlist.nil?
      self.public_setlist = PublicSetlist.new(setlist: self)
      self.public_setlist.save
    end
  end
end
