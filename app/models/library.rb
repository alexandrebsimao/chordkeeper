class Library < ApplicationRecord
  has_many :songs, dependent: :destroy
  has_many :library_users, dependent: :destroy
  has_many :users, through: :library_users
  has_many :setlists, dependent: :destroy

  validates :name, presence: true
end
