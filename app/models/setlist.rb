class Setlist < ApplicationRecord
  belongs_to :library
  has_many :setlist_songs, dependent: :destroy
  has_many :songs, through: :setlist_songs
end
